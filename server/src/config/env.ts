import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  notionToken: process.env.NOTION_TOKEN ?? "",
  notionDatabaseId: process.env.NOTION_DATABASE_ID ?? "",
  notionDataSourceId: process.env.NOTION_DATA_SOURCE_ID ?? "",
  notionProjectsDatabaseId: process.env.NOTION_PROJECTS_DATABASE_ID ?? "",
  notionProjectsDataSourceId: process.env.NOTION_PROJECTS_DATA_SOURCE_ID ?? "",
  notionWipgoDatabaseId: process.env.NOTION_WIPGO_DATABASE_ID ?? "",
  notionWipgoDataSourceId: process.env.NOTION_WIPGO_DATA_SOURCE_ID ?? "",
};
