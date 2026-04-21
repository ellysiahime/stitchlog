import { type Response, Router } from "express";
import { env } from "../config/env";
import { connectDB } from "../lib/mongodb";
import { syncNotionCollection } from "../services/notionSync";

const router = Router();

type CollectionConfig = {
  collectionName: string;
  databaseId?: string;
  dataSourceId?: string;
};

const notionCollections: Record<string, CollectionConfig> = {
  projects: {
    collectionName: "projects",
    databaseId: env.notionProjectsDatabaseId,
    dataSourceId: env.notionProjectsDataSourceId,
  },
  wipgo: {
    collectionName: "wipgo",
    databaseId: env.notionWipgoDatabaseId,
    dataSourceId: env.notionWipgoDataSourceId,
  },
};

async function fetchCollection(
  resource: keyof typeof notionCollections,
  res: Response
) {
  try {
    const config = notionCollections[resource];

    if (!config) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const db = await connectDB();
    const collection = db.collection(config.collectionName);
    const entries = await collection
      .find({})
      .sort({ lastEditedTime: -1, updatedAt: -1, title: 1 })
      .toArray();
    const lastSyncedEntry = await collection.find({}).sort({ updatedAt: -1 }).limit(1).next();

    return res.json({
      entries,
      lastSyncDate: lastSyncedEntry?.updatedAt ?? null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch synced data" });
  }
}

async function syncCollection(resource: keyof typeof notionCollections, res: Response) {
  try {
    const config = notionCollections[resource];

    if (!config) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (!config.databaseId && !config.dataSourceId) {
      return res.status(400).json({
        error: `Missing Notion database id or data source id for ${resource}`,
      });
    }

    const db = await connectDB();
    const collection = db.collection(config.collectionName);
    const result = await syncNotionCollection({
      collection,
      dataSourceId: config.dataSourceId,
      databaseId: config.databaseId,
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Sync failed" });
  }
}

router.get("/projects", async (_req, res) => fetchCollection("projects", res));
router.get("/wipgo", async (_req, res) => fetchCollection("wipgo", res));

router.post("/sync/projects", async (_req, res) => syncCollection("projects", res));
router.post("/sync/wipgo", async (_req, res) => syncCollection("wipgo", res));

export default router;
