import express from "express";
import cors from "cors";
import notionRouter from "./routes/notion";
import { connectDB } from "./lib/mongodb";
import testMongoRoute from "./routes/testMongo";
import syncStitchesRoute from "./routes/syncStitches";
import stitchesRoute from "./routes/stitches";


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

connectDB();

app.use("/api", testMongoRoute);

app.use("/api", syncStitchesRoute);

app.use("/api", stitchesRoute);

export default app;