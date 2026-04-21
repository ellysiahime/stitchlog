import { Router } from "express";
import { connectDB } from "../lib/mongodb";
import { notion } from "../services/notionService";

const router = Router();

type StitchEntry = {
  notionPageId: string;
  date: string;
  year: number;
  updatedAt: Date;
};

router.post("/sync/stitches", async (req, res) => {
  try {
    const year = Number(req.query.year);

    if (!year || Number.isNaN(year)) {
      return res.status(400).json({ error: "Valid year is required" });
    }

    const db = await connectDB();
    const collection = db.collection("stitch_entries");

    const allResults: unknown[] = [];
    let nextCursor: string | undefined = undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: process.env.NOTION_DATA_SOURCE_ID!,
        filter: {
          and: [
            {
              property: "Date",
              date: {
                on_or_after: `${year}-01-01`,
              },
            },
            {
              property: "Date",
              date: {
                before: `${year + 1}-01-01`,
              },
            },
          ],
        },
        sorts: [
          {
            property: "Date",
            direction: "descending",
          },
        ],
        page_size: 100,
        start_cursor: nextCursor,
      });

      allResults.push(...response.results);
      nextCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (nextCursor);

    const syncedAt = new Date();

    const filtered: StitchEntry[] = allResults
      .map((page) => {
        if (
          typeof page !== "object" ||
          page === null ||
          !("id" in page) ||
          !("properties" in page) ||
          !page.properties ||
          typeof page.properties !== "object"
        ) {
          return null;
        }

        const notionPageId = page.id;
        const properties = page.properties as Record<string, unknown>;
        const dateProperty = properties["Date"];

        const date =
          dateProperty &&
          typeof dateProperty === "object" &&
          "type" in dateProperty &&
          dateProperty.type === "date" &&
          "date" in dateProperty &&
          dateProperty.date &&
          typeof dateProperty.date === "object" &&
          "start" in dateProperty.date &&
          typeof dateProperty.date.start === "string"
            ? dateProperty.date.start
            : null;

        if (!date) return null;

        return {
          notionPageId: String(notionPageId),
          date,
          year,
          updatedAt: syncedAt,
        };
      })
      .filter((entry): entry is StitchEntry => entry !== null);

    const syncedNotionPageIds = filtered.map((entry) => entry.notionPageId);

    for (const entry of filtered) {
      await collection.updateOne(
        { notionPageId: entry.notionPageId },
        {
          $set: {
            date: entry.date,
            year: entry.year,
            updatedAt: entry.updatedAt,
          },
          $setOnInsert: {
            createdAt: syncedAt,
          },
        },
        { upsert: true }
      );
    }

    const deletedResult = await collection.deleteMany(
      {
        year,
        notionPageId: { $nin: syncedNotionPageIds },
      }
    );

    res.json({
      success: true,
      count: filtered.length,
      deletedCount: deletedResult.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sync failed" });
  }
});

export default router;
