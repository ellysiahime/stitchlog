import { Router } from "express";
import { connectDB } from "../lib/mongodb";

const router = Router();

router.get("/stitches", async (req, res) => {
  try {
    const year = Number(req.query.year);

    if (!year || Number.isNaN(year)) {
      return res.status(400).json({ error: "Valid year is required" });
    }

    const db = await connectDB();
    const collection = db.collection("stitch_entries");

    const data = await collection
      .find({ year })
      .sort({ date: 1 }) 
      .toArray();

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stitches" });
  }
});

export default router;