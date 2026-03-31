import { Router } from "express";
import { notion } from "../services/notionService";
import { env } from "../config/env";

const router = Router();

  router.get("/api/notion-test", async (_req, res) => {
    try {
      const response = await notion.databases.retrieve({
        database_id: env.notionDatabaseId,
      });
  
      const title =
        "title" in response && Array.isArray(response.title) && response.title.length > 0
          ? response.title[0].plain_text
          : "Untitled database";
  
      const dataSources =
        "data_sources" in response && Array.isArray(response.data_sources)
          ? response.data_sources.map((ds) => ({
              id: ds.id,
              name: "name" in ds ? ds.name : undefined,
            }))
          : [];
  
      res.json({
        ok: true,
        title,
        dataSources,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        ok: false,
        message: "Failed to connect to Notion database",
      });
    }
  });

  router.get("/api/notion-debug", async (_req, res) => {
    try {
      const response = await notion.databases.retrieve({
        database_id: env.notionDatabaseId,
      });
  
      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ ok: false, message: "Debug failed" });
    }
  });

export default router;