import { Router } from "express";
import { env } from "../config/env";
import { connectDB } from "../lib/mongodb";
import { normalizeMetadataValue, type ProjectRagDocument } from "../services/ai/projectRag";
import { embedText, generateChatAnswer } from "../services/ai/openai";
import { reindexProjectRag } from "../services/ai/reindexProjectRag";

const router = Router();

type ProjectRagSearchResult = ProjectRagDocument & {
  score?: number;
};

type ParsedProjectQuery = {
  fabricCountKey: string | null;
  statuses: string[];
  statusKeys: string[];
  typeKey: string | null;
  categoryKeys: string[];
  designerKeys: string[];
  completionState: "finished" | "in-progress" | "ready" | null;
  isRecommendation: boolean;
  hasMetadataFilters: boolean;
};

function mapStatusKey(status: string) {
  if (status === "ffo") {
    return "ffo";
  }

  if (status === "finished") {
    return "finished";
  }

  return normalizeMetadataValue(status);
}

function detectUnfinishedIntent(normalizedMessage: string) {
  return (
    /\bnot yet finished\b/i.test(normalizedMessage) ||
    /\bnot finished\b/i.test(normalizedMessage) ||
    /\bunfinished\b/i.test(normalizedMessage) ||
    /\bstill working on\b/i.test(normalizedMessage) ||
    /\bto work on\b/i.test(normalizedMessage) ||
    /\bwork on\b/i.test(normalizedMessage) ||
    /\bwip\b/i.test(normalizedMessage)
  );
}

function parseProjectQuery(message: string, metadataDocuments: ProjectRagDocument[]): ParsedProjectQuery {
  const normalizedMessage = message.toLowerCase();
  const fabricMatch = normalizedMessage.match(/\b(\d{2})\s*ct\b/i);
  const unfinishedIntent = detectUnfinishedIntent(normalizedMessage);
  const finishedIntent =
    !unfinishedIntent &&
    (/\bfinished\b/i.test(normalizedMessage) ||
      /\bcompleted\b/i.test(normalizedMessage) ||
      /\bffo\b/i.test(normalizedMessage));
  const detectedStatuses = [
    "active",
    "passive",
    "ready",
    "kip",
    "ufo",
    ...(finishedIntent ? ["finished", "ffo"] : []),
  ].filter((status) => new RegExp(`\\b${status}\\b`, "i").test(normalizedMessage));
  const detectedType = ["counted", "stamped", "blackwork"].find((type) =>
    new RegExp(`\\b${type}\\b`, "i").test(normalizedMessage)
  );
  const isRecommendation =
    /\brecommend\b/i.test(normalizedMessage) ||
    /\bsuggest\b/i.test(normalizedMessage) ||
    /\bwhich project\b/i.test(normalizedMessage) ||
    /\bwhat project\b/i.test(normalizedMessage) ||
    /\bto work on\b/i.test(normalizedMessage) ||
    /\bwork on\b/i.test(normalizedMessage);
  const metadataValueSets = {
    categoryKeys: [...new Set(metadataDocuments.flatMap((document) => document.categoryKeys ?? []))],
    designerKeys: [
      ...new Set(
        metadataDocuments
          .map((document) => document.designerKey)
          .filter((value): value is string => Boolean(value))
      ),
    ],
  };
  const normalizedQuery = normalizeMetadataValue(message);
  const categoryKeys = metadataValueSets.categoryKeys.filter((value) =>
    normalizedQuery.includes(value)
  );
  const designerKeys = metadataValueSets.designerKeys.filter((value) =>
    normalizedQuery.includes(value)
  );

  let statusKeys = detectedStatuses.map((status) => mapStatusKey(status));

  if (unfinishedIntent) {
    statusKeys = statusKeys.length > 0 ? statusKeys : ["active", "passive", "ready", "kip"];
  } else if (isRecommendation && statusKeys.length === 0) {
    statusKeys = ["active", "passive"];
  }

  const completionState =
    unfinishedIntent
      ? "in-progress"
      : finishedIntent
      ? "finished"
      : /\bready\b/i.test(normalizedMessage)
        ? "ready"
        : /\bin progress\b/i.test(normalizedMessage) || /\bwork in progress\b/i.test(normalizedMessage)
          ? "in-progress"
          : null;

  const statuses = statusKeys.map((status) =>
    status === "ffo" ? "FFO" : status === "kip" ? "KIP" : status.charAt(0).toUpperCase() + status.slice(1)
  );
  const hasMetadataFilters =
    Boolean(fabricMatch) ||
    statusKeys.length > 0 ||
    Boolean(detectedType) ||
    categoryKeys.length > 0 ||
    designerKeys.length > 0 ||
    Boolean(completionState);

  return {
    fabricCountKey: fabricMatch ? normalizeMetadataValue(`${fabricMatch[1]}ct`) : null,
    statuses,
    statusKeys,
    typeKey: detectedType ? normalizeMetadataValue(detectedType) : null,
    categoryKeys,
    designerKeys,
    completionState,
    isRecommendation,
    hasMetadataFilters,
  };
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return -1;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return -1;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function findMetadataFilteredProjectMatches(
  message: string,
  ragCollection: {
    find: (filter?: Record<string, unknown>) => {
      project: (...args: unknown[]) => {
        toArray: () => Promise<unknown[]>;
      };
    };
  }
) {
  const metadataDocuments = (await ragCollection
    .find({})
    .project({
      _id: 0,
      notionPageId: 1,
      title: 1,
      url: 1,
      notes: 1,
      designer: 1,
      percentComplete: 1,
      finishedDate: 1,
      daysStitched: 1,
      fabricCount: 1,
      fabricDetails: 1,
      status: 1,
      startDate: 1,
      categories: 1,
      stitchCount: 1,
      type: 1,
      progressPicsUrl: 1,
      metadataText: 1,
      semanticText: 1,
      designerKey: 1,
      statusKey: 1,
      fabricCountKey: 1,
      typeKey: 1,
      categoryKeys: 1,
      completionState: 1,
      embedding: 1,
      updatedAt: 1,
    })
    .toArray()) as ProjectRagSearchResult[];

  const parsedQuery = parseProjectQuery(message, metadataDocuments);

  if (!parsedQuery.hasMetadataFilters) {
    return [];
  }

  const filteredDocuments = metadataDocuments.filter((document) => {
    if (parsedQuery.fabricCountKey && document.fabricCountKey !== parsedQuery.fabricCountKey) {
      return false;
    }

    if (parsedQuery.statusKeys.length > 0 && (!document.statusKey || !parsedQuery.statusKeys.includes(document.statusKey))) {
      return false;
    }

    if (parsedQuery.typeKey && document.typeKey !== parsedQuery.typeKey) {
      return false;
    }

    if (
      parsedQuery.categoryKeys.length > 0 &&
      !parsedQuery.categoryKeys.every((categoryKey) => document.categoryKeys.includes(categoryKey))
    ) {
      return false;
    }

    if (
      parsedQuery.designerKeys.length > 0 &&
      (!document.designerKey || !parsedQuery.designerKeys.includes(document.designerKey))
    ) {
      return false;
    }

    if (parsedQuery.completionState && document.completionState !== parsedQuery.completionState) {
      return false;
    }

    return true;
  });

  if (filteredDocuments.length === 0) {
    return [];
  }

  const queryEmbedding = await embedText(message);

  return filteredDocuments
    .map((document) => ({
      ...document,
      score: cosineSimilarity(queryEmbedding, document.embedding),
    }))
    .sort((leftDocument, rightDocument) => {
      const scoreDifference = (rightDocument.score ?? -1) - (leftDocument.score ?? -1);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const percentDifference = (rightDocument.percentComplete ?? -1) - (leftDocument.percentComplete ?? -1);

      if (percentDifference !== 0) {
        return percentDifference;
      }

      return (leftDocument.title ?? "").localeCompare(rightDocument.title ?? "");
    })
    .slice(0, 3);
}

router.post("/ai/projects/reindex", async (_req, res) => {
  try {
    return res.json(await reindexProjectRag());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to reindex project RAG documents" });
  }
});

router.post("/ai/chat", async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const db = await connectDB();
    const ragCollection = db.collection(env.mongodbProjectRagCollectionName);
    const structuredMatches = await findMetadataFilteredProjectMatches(message, ragCollection);

    const matches =
      structuredMatches.length > 0
        ? structuredMatches
        : ((await (async () => {
            const queryEmbedding = await embedText(message);

            return ragCollection
              .aggregate([
                {
                  $vectorSearch: {
                    index: env.mongodbProjectRagVectorIndexName,
                    path: "embedding",
                    queryVector: queryEmbedding,
                    numCandidates: 30,
                    limit: 3,
                  },
                },
                {
                  $project: {
                    _id: 0,
                    notionPageId: 1,
                    title: 1,
                    url: 1,
                    notes: 1,
                    designer: 1,
                    percentComplete: 1,
                    finishedDate: 1,
                    daysStitched: 1,
                    fabricCount: 1,
                    fabricDetails: 1,
                    status: 1,
                    startDate: 1,
                    categories: 1,
                    stitchCount: 1,
                    type: 1,
                    progressPicsUrl: 1,
                    searchText: 1,
                    embedding: 1,
                    updatedAt: 1,
                    score: { $meta: "vectorSearchScore" },
                  },
                },
              ])
              .toArray();
          })()) as ProjectRagSearchResult[]);

    if (matches.length === 0) {
      return res.json({
        answer: "I couldn't find any indexed project context yet. Reindex the projects collection first.",
        sources: [],
      });
    }

    const { answer, sources } = await generateChatAnswer(message, matches);

    return res.json({
      answer,
      sources: sources.map((source, index) => ({
        ...source,
        score: matches[index]?.score,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to answer AI chat request" });
  }
});

export default router;
