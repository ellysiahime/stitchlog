import { Router } from "express";
import { notion } from "../services/notionService";
import { env } from "../config/env";

const router = Router();

router.get("/api/stitches", async (req, res) => {
  try {
    const yearParam = req.query.year as string | undefined;
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        message: "Invalid year parameter",
      });
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year + 1}-01-01`;

    const allResults: unknown[] = [];
    let nextCursor: string | undefined = undefined;

    do {
      const response = await notion.dataSources.query({
        data_source_id: env.notionDataSourceId,
        filter: {
          and: [
            {
              property: "Date",
              date: {
                on_or_after: startDate,
              },
            },
            {
              property: "Date",
              date: {
                before: endDate,
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

    const data = allResults
      .map((page) => {
        if (
          typeof page !== "object" ||
          page === null ||
          !("properties" in page) ||
          !page.properties ||
          typeof page.properties !== "object"
        ) {
          return null;
        }

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
          "start" in dateProperty.date
            ? dateProperty.date.start
            : null;

        if (!date || typeof date !== "string") return null;

        return { date };
      })
      .filter((item): item is { date: string } => item !== null);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch stitches",
    });
  }
});

export default router;