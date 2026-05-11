import { env } from "../../config/env";
import { connectDB } from "../../lib/mongodb";
import { embedText } from "./openai";
import { buildProjectRagDocument } from "./projectRag";

type ProjectSourceDocument = {
  notionPageId: string;
  title?: string | null;
  url?: string | null;
  notes?: string | null;
  progressPicsUrl?: string | null;
  properties?: Record<string, unknown>;
};

export async function reindexProjectRag() {
  const db = await connectDB();
  const projectsCollection = db.collection("projects");
  const ragCollection = db.collection(env.mongodbProjectRagCollectionName);
  const projects = (await projectsCollection.find({}).toArray()) as ProjectSourceDocument[];
  const updatedAt = new Date();

  let indexedCount = 0;

  for (const project of projects) {
    const ragDocument = buildProjectRagDocument(project, updatedAt);
    const embedding = await embedText(ragDocument.semanticText);

    await ragCollection.updateOne(
      { notionPageId: ragDocument.notionPageId },
      {
        $set: {
          ...ragDocument,
          embedding,
        },
        $setOnInsert: {
          createdAt: updatedAt,
        },
      },
      { upsert: true }
    );

    indexedCount += 1;
  }

  await ragCollection.deleteMany({
    notionPageId: {
      $nin: projects.map((project: ProjectSourceDocument) => project.notionPageId),
    },
  });

  return {
    success: true,
    count: indexedCount,
    collectionName: env.mongodbProjectRagCollectionName,
    vectorIndexName: env.mongodbProjectRagVectorIndexName,
  };
}
