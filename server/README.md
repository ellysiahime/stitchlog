# StitchLog Server

This server is an Express + TypeScript API for syncing Notion data into MongoDB and powering the StitchLog dashboard and AI chat experience.

## Current responsibilities

- Syncs yearly stitch entries from Notion into `stitch_entries`
- Syncs project and WIPGO collections from Notion into MongoDB
- Normalizes Notion properties into a frontend-friendly document shape
- Extracts project notes and progress picture URLs from Notion page markdown
- Reindexes project records into a RAG collection with OpenAI embeddings
- Answers AI chat requests using metadata filters first, then vector search

## API surface

- `GET /api/health`
- `GET /api/stitches?year=YYYY`
- `POST /api/sync/stitches?year=YYYY`
- `GET /api/projects`
- `POST /api/sync/projects`
- `GET /api/wipgo`
- `POST /api/sync/wipgo`
- `POST /api/ai/chat`
- `POST /api/ai/projects/reindex`

## Architecture decisions

- MongoDB is used as the operational store so the UI can read quickly without querying Notion directly.
- Notion sync is collection-oriented and explicit; data is fetched in batches, normalized, then upserted.
- Projects and WIPGO share a generic sync path through `services/notionSync.ts`, while stitch heatmap sync stays separate because it is year-filtered and simpler.
- Project RAG documents are derived from synced projects rather than raw Notion results, which keeps the AI layer consistent with the rest of the app.
- AI retrieval prefers structured metadata matches before semantic search so questions like status, fabric count, category, or type can stay precise.

## Folder guide

- `src/app.ts`: app setup and route registration
- `src/routes/`: HTTP endpoints
- `src/services/notionSync.ts`: generic Notion-to-Mongo sync pipeline
- `src/services/ai/`: embeddings, prompt construction, RAG document building, and reindexing
- `src/lib/mongodb.ts`: MongoDB connection singleton
- `src/config/env.ts`: environment loading and defaults

## Important operational notes

- `MONGODB_URI` is required at startup; the server throws early if it is missing.
- Syncing `projects` automatically triggers RAG reindexing.
- AI chat requires both the OpenAI configuration and a MongoDB vector index that matches `MONGODB_PROJECT_RAG_VECTOR_INDEX_NAME`.
- The sync layer deletes MongoDB documents that no longer exist in the upstream Notion result set for that collection.