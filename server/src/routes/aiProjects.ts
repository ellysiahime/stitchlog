import { Router } from "express";
import { env } from "../config/env";
import { connectDB } from "../lib/mongodb";
import { type ProjectRagDocument } from "../services/ai/projectRag";
import { embedText, generateChatAnswer } from "../services/ai/openai";
import { reindexProjectRag } from "../services/ai/reindexProjectRag";

const router = Router();

type ProjectRagSearchResult = ProjectRagDocument & {
  score?: number;
};

type ParsedProjectQuery = {
  fabricCount: string | null;
  statuses: string[];
  type: string | null;
  isRecommendation: boolean;
  shouldPreferStructuredLookup: boolean;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseProjectQuery(message: string): ParsedProjectQuery {
  const normalizedMessage = message.toLowerCase();
  const fabricMatch = normalizedMessage.match(/\b(\d{2})\s*ct\b/i);
  const detectedStatuses = [
    "active",
    "passive",
    "ready",
    "kip",
    "ufo",
    "finished",
    "ffo",
  ].filter((status) => new RegExp(`\\b${status}\\b`, "i").test(normalizedMessage));
  const detectedType = ["counted", "stamped", "blackwork"].find((type) =>
    new RegExp(`\\b${type}\\b`, "i").test(normalizedMessage)
  );
  const isRecommendation =
    /\brecommend\b/i.test(normalizedMessage) ||
    /\bsuggest\b/i.test(normalizedMessage) ||
    /\bwhich project\b/i.test(normalizedMessage) ||
    /\bwhat project\b/i.test(normalizedMessage);
  const hasStructuredHints =
    Boolean(fabricMatch) || detectedStatuses.length > 0 || Boolean(detectedType);

  let statuses = detectedStatuses.map((status) =>
    status === "ffo" ? "FFO" : status === "finished" ? "Finished" : status === "kip" ? "KIP" : status.charAt(0).toUpperCase() + status.slice(1)
  );

  if (isRecommendation && statuses.length === 0) {
    statuses = ["Active", "Passive"];
  }

  return {
    fabricCount: fabricMatch ? `${fabricMatch[1]}ct` : null,
    statuses,
    type: detectedType ? detectedType.charAt(0).toUpperCase() + detectedType.slice(1) : null,
    isRecommendation,
    shouldPreferStructuredLookup: hasStructuredHints || isRecommendation,
  };
}

async function findStructuredProjectMatches(
  message: string,
  ragCollection: {
    find: (...args: unknown[]) => {
      project: (...args: unknown[]) => {
        sort: (...args: unknown[]) => {
          limit: (limit: number) => {
            toArray: () => Promise<unknown[]>;
          };
        };
      };
    };
  }
) {
  const parsedQuery = parseProjectQuery(message);

  if (!parsedQuery.shouldPreferStructuredLookup) {
    return [];
  }

  const filter: Record<string, unknown> = {};

  if (parsedQuery.fabricCount) {
    filter.fabricCount = {
      $regex: `^${escapeRegex(parsedQuery.fabricCount)}$`,
      $options: "i",
    };
  }

  if (parsedQuery.statuses.length > 0) {
    filter.status = {
      $in: parsedQuery.statuses.map((status) => new RegExp(`^${escapeRegex(status)}$`, "i")),
    };
  }

  if (parsedQuery.type) {
    filter.type = {
      $regex: `^${escapeRegex(parsedQuery.type)}$`,
      $options: "i",
    };
  }

  return (await ragCollection
    .find(filter)
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
      searchText: 1,
      embedding: 1,
      updatedAt: 1,
    })
    .sort({
      percentComplete: -1,
      daysStitched: -1,
      title: 1,
    })
    .limit(3)
    .toArray()) as ProjectRagSearchResult[];
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
    const structuredMatches = await findStructuredProjectMatches(message, ragCollection);

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
