import { Router } from "express";
import { connectDB } from "../lib/mongodb";

const router = Router();

router.get("/test-mongo", async (req, res) => {
  try {
    const db = await connectDB();

    const result = await db.collection("stitch_entries").insertOne({
      notionPageId: "test123",
      date: "2026-04-02",
      year: 2026,
      createdAt: new Date(),
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Mongo test failed" });
  }
});

export default router;