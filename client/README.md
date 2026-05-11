# StitchLog Client

This frontend is a Vite + React dashboard for viewing stitching activity, browsing projects, checking a WIPGO board, and chatting with the project library through the API.

## Current features

- Year-based stitch heatmap with session and streak statistics
- Project library view with status badges, Notion links, and progress picture links
- WIPGO 5x5 board assembled from WIPGO entries plus related project records
- AI chat interface for project-aware questions and recommendations
- Manual sync actions for heatmap, projects, and WIPGO data

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Base UI / shadcn-style primitives
- Vitest + Testing Library

## Frontend architecture

- `src/routes/AppRouter.tsx`: lightweight hash-based route resolution.
- `src/components/layout/`: shell, stat cards, and heatmap presentation pieces.
- `src/pages/`: page-level screens for heatmap, projects, WIPGO, and AI chat.
- `src/services/stitchlogApi.ts`: all API calls and shared response types.
- `src/utils/`: client-side formatting and derived view-model logic.

## Why it is structured this way

- Hash routing avoids extra server-side SPA routing setup and is enough for this dashboard.
- API calls are centralized so the pages do not duplicate endpoint details or response typing.
- Data transformation for Notion-derived records lives in utility functions.
- The shell component owns the shared navigation and visual framing so each page can stay focused on one feature area.

## Important implementation notes

- The dev server proxies `/api` to `http://localhost:4000` via `vite.config.ts`.
- The home page only shows the sync action for the current year.
- The WIPGO page depends on relation IDs from synced Notion data to map tiles back to projects.
- The AI page submits questions to the server and renders the returned answer and matched project sources. Retrieval, filtering, embeddings, and vector search all happen on the server.

## Testing

Current test coverage focuses on the client logic that is easiest to regress quietly:

- API service helpers
- heatmap utilities
- stats utilities
