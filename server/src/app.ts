import express from "express";
import cors from "cors";
import notionRouter from "./routes/notion";
import stitchesRouter from "./routes/stitches";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("StitchLog API is running");
});

app.get("/api/health", (_req, res) => {
  res.json({ message: "Server is running" });
});

app.use(notionRouter);

app.use(stitchesRouter);

export default app;