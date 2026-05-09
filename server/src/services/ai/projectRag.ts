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
  searchText: string;
  embedding: number[];
  updatedAt: Date;
};

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

function buildSearchText(document: Omit<ProjectRagDocument, "embedding" | "updatedAt">) {
  const statusMeaning =
    document.status === "Active"
      ? "project currently stitching"
      : document.status === "Passive"
        ? "project that has not been touched for quite some time"
        : document.status === "Ready"
          ? "fully kitted project that is ready to start"
          : document.status === "UFO"
            ? "unfinished object, often abandoned or inactive"
            : document.status === "FFO" || document.status === "Finished"
              ? "fully finished object"
              : document.status === "KIP"
                ? "kit in progress"
                : null;

  const lines = [
    document.title ? `Project Title: ${document.title}` : null,
    document.designer ? `Designer: ${document.designer}` : null,
    document.status ? `Status: ${document.status}` : null,
    statusMeaning ? `Status Meaning: ${statusMeaning}` : null,
    document.type ? `Type: ${document.type}` : null,
    document.fabricCount ? `Fabric Count: ${document.fabricCount}` : null,
    document.fabricDetails ? `Fabric Details: ${document.fabricDetails}` : null,
    document.stitchCount ? `Stitch Count: ${document.stitchCount}` : null,
    document.percentComplete !== null ? `Percent Complete: ${document.percentComplete}%` : null,
    document.daysStitched !== null ? `Days Stitched: ${document.daysStitched}` : null,
    document.startDate ? `Start Date: ${document.startDate}` : null,
    document.finishedDate ? `Finished Date: ${document.finishedDate}` : null,
    document.categories.length ? `Categories: ${document.categories.join(", ")}` : null,
    "Glossary: UFO means UnFinished Object. FFO means FullyFinished Object. WIP means Work In Progress. KIP means Kit In Progress.",
    "Glossary: Active means currently stitching. Passive means not touched for quite some time. Ready means fully kitted and ready to start.",
    "Glossary: BS means Barely Start, usually mentioned in notes and not necessarily the actual status. NS means New Start, usually mentioned in notes and not necessarily the actual status.",
    document.notes ? `Notes: ${document.notes}` : null,
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
    searchText: "",
    updatedAt,
  };

  return {
    ...documentWithoutEmbedding,
    searchText: buildSearchText(documentWithoutEmbedding),
  };
}
