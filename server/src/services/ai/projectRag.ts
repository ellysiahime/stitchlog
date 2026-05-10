type NotionOption = {
  name?: string | null;
};

type NotionDate = {
  start?: string | null;
};

type ProjectSourceDocument = {
  notionPageId: string;
  title?: string | null;
  url?: string | null;
  notes?: string | null;
  progressPicsUrl?: string | null;
  properties?: Record<string, unknown>;
};

export type ProjectRagDocument = {
  notionPageId: string;
  title: string | null;
  url: string | null;
  notes: string | null;
  designer: string | null;
  percentComplete: number | null;
  finishedDate: string | null;
  daysStitched: number | null;
  fabricCount: string | null;
  fabricDetails: string | null;
  status: string | null;
  startDate: string | null;
  categories: string[];
  stitchCount: string | null;
  type: string | null;
  progressPicsUrl: string | null;
  metadataText: string;
  semanticText: string;
  designerKey: string | null;
  statusKey: string | null;
  fabricCountKey: string | null;
  typeKey: string | null;
  categoryKeys: string[];
  completionState: "finished" | "in-progress" | "ready" | "unknown";
  embedding: number[];
  updatedAt: Date;
};

export function normalizeMetadataValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getOptionName(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return getStringValue((value as NotionOption).name);
}

function getDateStart(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return getStringValue((value as NotionDate).start);
}

function getOptionNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => getOptionName(item))
    .filter((item): item is string => Boolean(item));
}

function resolveCompletionState(document: {
  status: string | null;
  finishedDate: string | null;
  percentComplete: number | null;
  startDate: string | null;
}) {
  const statusKey = document.status ? normalizeMetadataValue(document.status) : null;

  if (document.finishedDate || statusKey === "finished" || statusKey === "ffo") {
    return "finished" as const;
  }

  if (statusKey === "ready") {
    return "ready" as const;
  }

  if (document.startDate || (document.percentComplete !== null && document.percentComplete > 0)) {
    return "in-progress" as const;
  }

  return "unknown" as const;
}

function buildSemanticSearchText(
  document: Pick<
    ProjectRagDocument,
    | "title"
    | "notes"
    | "fabricDetails"
    | "stitchCount"
    | "percentComplete"
    | "daysStitched"
    | "startDate"
    | "finishedDate"
  >
) {
  const lines = [
    document.title ? `Project Title: ${document.title}` : null,
    document.fabricDetails ? `Fabric Details: ${document.fabricDetails}` : null,
    document.stitchCount ? `Stitch Count: ${document.stitchCount}` : null,
    document.percentComplete !== null ? `Percent Complete: ${document.percentComplete}%` : null,
    document.daysStitched !== null ? `Days Stitched: ${document.daysStitched}` : null,
    document.startDate ? `Start Date: ${document.startDate}` : null,
    document.finishedDate ? `Finished Date: ${document.finishedDate}` : null,
    document.notes ? `Notes: ${document.notes}` : null,
  ];

  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

function buildMetadataText(document: Omit<ProjectRagDocument, "embedding" | "updatedAt">) {
  const lines = [
    document.title ? `Project Title: ${document.title}` : null,
    document.designer ? `Designer: ${document.designer}` : null,
    document.status ? `Status: ${document.status}` : null,
    document.type ? `Type: ${document.type}` : null,
    document.fabricCount ? `Fabric Count: ${document.fabricCount}` : null,
    document.fabricDetails ? `Fabric Details: ${document.fabricDetails}` : null,
    document.stitchCount ? `Stitch Count: ${document.stitchCount}` : null,
    document.percentComplete !== null ? `Percent Complete: ${document.percentComplete}%` : null,
    document.daysStitched !== null ? `Days Stitched: ${document.daysStitched}` : null,
    document.startDate ? `Start Date: ${document.startDate}` : null,
    document.finishedDate ? `Finished Date: ${document.finishedDate}` : null,
    document.categories.length ? `Categories: ${document.categories.join(", ")}` : null,
    `Completion State: ${document.completionState}`,
  ];

  return lines.filter((line): line is string => Boolean(line)).join("\n");
}

export function buildProjectRagDocument(
  source: ProjectSourceDocument,
  updatedAt: Date
): Omit<ProjectRagDocument, "embedding"> {
  const properties = source.properties ?? {};
  const title = getStringValue(source.title);
  const url = getStringValue(source.url);
  const notes = getStringValue(source.notes);
  const designer = getOptionName(properties.Designer);
  const percentComplete = getNumberValue(properties["% Complete"]);
  const finishedDate = getDateStart(properties.Finish);
  const daysStitched = getNumberValue(properties["Days Stitched"]);
  const fabricCount = getOptionName(properties["Fabric Count"]);
  const fabricDetails = getStringValue(properties["Fabric Details"]);
  const status = getOptionName(properties.Status);
  const startDate = getDateStart(properties.Start);
  const categories = getOptionNames(properties.Category);
  const stitchCount = getStringValue(properties["Stitch Count"]);
  const type = getOptionName(properties.Type);
  const progressPicsUrl = getStringValue(source.progressPicsUrl);
  const completionState = resolveCompletionState({
    status,
    finishedDate,
    percentComplete,
    startDate,
  });

  const documentWithoutEmbedding = {
    notionPageId: source.notionPageId,
    title,
    url,
    notes,
    designer,
    percentComplete,
    finishedDate,
    daysStitched,
    fabricCount,
    fabricDetails,
    status,
    startDate,
    categories,
    stitchCount,
    type,
    progressPicsUrl,
    metadataText: "",
    semanticText: "",
    designerKey: designer ? normalizeMetadataValue(designer) : null,
    statusKey: status ? normalizeMetadataValue(status) : null,
    fabricCountKey: fabricCount ? normalizeMetadataValue(fabricCount) : null,
    typeKey: type ? normalizeMetadataValue(type) : null,
    categoryKeys: categories.map((category) => normalizeMetadataValue(category)),
    completionState,
    updatedAt,
  };

  return {
    ...documentWithoutEmbedding,
    semanticText: buildSemanticSearchText(documentWithoutEmbedding),
    metadataText: buildMetadataText(documentWithoutEmbedding),
  };
}
