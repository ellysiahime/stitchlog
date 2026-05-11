import OpenAI from "openai";
import { env } from "../../config/env";
import type { ProjectRagDocument } from "./projectRag";

type ChatSource = Pick<
  ProjectRagDocument,
  "notionPageId" | "title" | "url" | "status" | "fabricCount" | "categories"
> & {
  score?: number;
};

let client: OpenAI | null = null;

function getClient() {
  if (!env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }

  return client;
}

export async function embedText(text: string) {
  const response = await getClient().embeddings.create({
    model: env.openaiEmbeddingModel,
    input: text,
  });

  return response.data[0]?.embedding ?? [];
}

function buildContextBlock(projects: ProjectRagDocument[]) {
  return projects
    .map((project, index) => {
      const segments = [
        `Source ${index + 1}`,
        `Title: ${project.title ?? "Unknown"}`,
        project.status ? `Status: ${project.status}` : null,
        project.designer ? `Designer: ${project.designer}` : null,
        project.fabricCount ? `Fabric Count: ${project.fabricCount}` : null,
        project.fabricDetails ? `Fabric Details: ${project.fabricDetails}` : null,
        project.type ? `Type: ${project.type}` : null,
        project.stitchCount ? `Stitch Count: ${project.stitchCount}` : null,
        project.percentComplete !== null ? `Percent Complete: ${project.percentComplete}%` : null,
        project.daysStitched !== null ? `Days Stitched: ${project.daysStitched}` : null,
        project.startDate ? `Start Date: ${project.startDate}` : null,
        project.finishedDate ? `Finished Date: ${project.finishedDate}` : null,
        project.categories.length ? `Categories: ${project.categories.join(", ")}` : null,
        project.notes ? `Notes: ${project.notes}` : null,
        project.url ? `URL: ${project.url}` : null,
      ];

      return segments.filter((segment): segment is string => Boolean(segment)).join("\n");
    })
    .join("\n\n");
}

export async function generateChatAnswer(question: string, projects: ProjectRagDocument[]) {
  const contextBlock = buildContextBlock(projects);
  const response = await getClient().responses.create({
    model: env.openaiChatModel,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are a stitching assistant for a personal project library. " +
              "Answer only from the provided project context. If the answer is uncertain, say so plainly. " +
              "Be concise, helpful, and mention project titles when recommending something.\n\n" +
              "Stitching glossary:\n" +
              "- UFO = UnFinished Object.\n" +
              "- FFO = FullyFinished Object.\n" +
              "- WIP = Work In Progress.\n" +
              "- KIP = Kit In Progress.\n" +
              "- Active = project currently stitching.\n" +
              "- Passive = project that has not been touched for quite some time.\n" +
              "- Ready = fully kitted project, ready to start.\n" +
              "- BS = Barely Start. This is usually mentioned in notes and is not necessarily the actual project status.\n" +
              "- NS = New Start. This is usually mentioned in notes and is not necessarily the actual project status.\n\n" +
              "Behavior rules:\n" +
              "- If the retrieved context has already been narrowed by exact metadata such as category, designer, status, fabric count, type, or completion state, treat those constraints as authoritative and do not broaden beyond them.\n" +
              "- Interpret 'not yet finished', 'unfinished', 'project to work on', and similar phrasing as WIP-style intent. Those usually mean projects that are not finished yet.\n" +
              "- For 'project to work on' or general recommendation phrasing, prefer WIP-style candidates such as Active, Passive, Ready, or KIP unless the user explicitly asks for finished projects.\n" +
              "- Do not recommend UFO projects by default unless the user explicitly asks for abandoned, inactive, or unfinished-object projects.\n" +
              "- If the type is mentioned such as counted, stamped, or blackwork, then only recommend projects in that type.\n" +
              "- Prefer Active, Passive, Ready, or KIP projects when the user asks for recommendations.\n" +
              "- Treat FFO or Finished projects as completed and do not recommend them for new stitching unless the user explicitly asks for finished projects.\n" +
              "- If BS or NS appears in notes, treat it as additional context rather than the authoritative status.\n" +
              "- Use the actual status field over notes when they conflict.\n" +
              "- If a project is Passive, mention that it has not been touched for some time if that matters to the recommendation.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Question:\n${question}\n\nProject context:\n${contextBlock}`,
          },
        ],
      },
    ],
  });

  const sources: ChatSource[] = projects.map((project) => ({
    notionPageId: project.notionPageId,
    title: project.title,
    url: project.url,
    status: project.status,
    fabricCount: project.fabricCount,
    categories: project.categories,
  }));

  return {
    answer: response.output_text?.trim() || "I couldn't generate an answer from the available project data.",
    sources,
  };
}
