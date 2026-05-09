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
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiChatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  mongodbProjectRagCollectionName: process.env.MONGODB_PROJECT_RAG_COLLECTION_NAME ?? "project_rag",
  mongodbProjectRagVectorIndexName:
    process.env.MONGODB_PROJECT_RAG_VECTOR_INDEX_NAME ?? "project_rag_embedding_index",
};
