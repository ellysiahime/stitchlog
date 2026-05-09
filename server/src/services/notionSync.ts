import { notion } from "./notionService";

type NotionRichTextItem = {
  plain_text?: string;
};

type NotionSelectOption = {
  id?: string;
  name?: string;
  color?: string;
};

type NotionDateValue = {
  start?: string | null;
  end?: string | null;
  time_zone?: string | null;
};

type NotionFileValue = {
  name?: string;
  type?: string;
  file?: {
    url?: string;
    expiry_time?: string;
  };
  external?: {
    url?: string;
  };
};

type NotionProperty = {
  type?: string;
  title?: NotionRichTextItem[];
  rich_text?: NotionRichTextItem[];
  number?: number | null;
  checkbox?: boolean;
  url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  select?: NotionSelectOption | null;
  status?: NotionSelectOption | null;
  multi_select?: NotionSelectOption[];
  files?: NotionFileValue[];
  relation?: Array<{ id?: string }>;
  date?: NotionDateValue | null;
  formula?: {
    type?: string;
    string?: string | null;
    number?: number | null;
    boolean?: boolean | null;
    date?: NotionDateValue | null;
  };
  unique_id?: {
    prefix?: string | null;
    number?: number | null;
  } | null;
  created_time?: string;
  last_edited_time?: string;
};

type NotionPageResult = {
  id?: string;
  url?: string;
  archived?: boolean;
  in_trash?: boolean;
  created_time?: string;
  last_edited_time?: string;
  properties?: Record<string, NotionProperty>;
};

type NotionDatabaseResponse = {
  id?: string;
  data_sources?: Array<{
    id?: string;
    name?: string;
  }>;
};

export type SyncedNotionDocument = {
  notionPageId: string;
  title: string | null;
  url: string | null;
  archived: boolean;
  inTrash: boolean;
  createdTime: string | null;
  lastEditedTime: string | null;
  properties: Record<string, unknown>;
  relationIds: Record<string, string[]>;
  notes: string | null | undefined;
  progressPicsUrl: string | null | undefined;
  updatedAt: Date;
};

function getPlainText(items?: NotionRichTextItem[]) {
  if (!items?.length) return null;
  return items.map((item) => item.plain_text ?? "").join("").trim() || null;
}

function normalizeOptionName(name?: string) {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return null;
  }

  if (trimmedName.toLowerCase() === "finish! 🛎") {
    return "Finished";
  }

  if (trimmedName.toLowerCase() === "finished") {
    return "Finished";
  }

  return trimmedName;
}

function normalizeOption(option?: NotionSelectOption | null) {
  if (!option) return null;

  return {
    id: option.id ?? null,
    name: normalizeOptionName(option.name),
    color: option.color ?? null,
  };
}

function normalizeDate(date?: NotionDateValue | null) {
  if (!date?.start) return null;

  return {
    start: date.start,
    end: date.end ?? null,
    timeZone: date.time_zone ?? null,
  };
}

function normalizeFiles(files?: NotionFileValue[]) {
  if (!files?.length) return [];

  return files.map((file) => ({
    name: file.name ?? null,
    type: file.type ?? null,
    url:
      file.type === "external"
        ? file.external?.url ?? null
        : file.file?.url ?? null,
    expiryTime: file.file?.expiry_time ?? null,
  }));
}

function normalizeFormulaValue(property: NotionProperty) {
  const formula = property.formula;

  if (!formula?.type) return null;

  switch (formula.type) {
    case "string":
      return formula.string ?? null;
    case "number":
      return formula.number ?? null;
    case "boolean":
      return formula.boolean ?? null;
    case "date":
      return normalizeDate(formula.date);
    default:
      return null;
  }
}

function normalizeProperty(property: NotionProperty): unknown {
  switch (property.type) {
    case "title":
      return getPlainText(property.title);
    case "rich_text":
      return getPlainText(property.rich_text);
    case "number":
      return property.number ?? null;
    case "checkbox":
      return property.checkbox ?? false;
    case "url":
      return property.url ?? null;
    case "email":
      return property.email ?? null;
    case "phone_number":
      return property.phone_number ?? null;
    case "select":
      return normalizeOption(property.select);
    case "status":
      return normalizeOption(property.status);
    case "multi_select":
      return (property.multi_select ?? []).map((option) => normalizeOption(option));
    case "files":
      return normalizeFiles(property.files);
    case "relation":
      return (property.relation ?? [])
        .map((relation) => relation.id)
        .filter((id): id is string => Boolean(id));
    case "date":
      return normalizeDate(property.date);
    case "formula":
      return normalizeFormulaValue(property);
    case "unique_id":
      return property.unique_id
        ? {
            prefix: property.unique_id.prefix ?? null,
            number: property.unique_id.number ?? null,
          }
        : null;
    case "created_time":
      return property.created_time ?? null;
    case "last_edited_time":
      return property.last_edited_time ?? null;
    default:
      return null;
  }
}

function normalizeProperties(properties: Record<string, NotionProperty>) {
  const normalized: Record<string, unknown> = {};
  const relationIds: Record<string, string[]> = {};
  let title: string | null = null;

  for (const [propertyName, property] of Object.entries(properties)) {
    const value = normalizeProperty(property);
    normalized[propertyName] = value;

    if (property.type === "title" && typeof value === "string") {
      title = value;
    }

    if (property.type === "relation" && Array.isArray(value)) {
      relationIds[propertyName] = value.filter(
        (relationId): relationId is string => typeof relationId === "string"
      );
    }
  }

  return { normalized, relationIds, title };
}

async function queryAllPages(dataSourceId: string) {
  const results: NotionPageResult[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: nextCursor,
    });

    results.push(...(response.results as NotionPageResult[]));
    nextCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (nextCursor);

  return results;
}

function extractProgressPicsUrl(markdown: string) {
  const match = markdown.match(
    /###\s*Progress\s*Pic\s*<database\s+url="([^"]+)"[^>]*>\s*<\/database>/i
  );

  return match?.[1]?.trim() || null;
}

function normalizeNotes(markdown: string) {
  const withoutImages = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/###\s*Progress\s*Pic\s*<database\s+url="[^"]+"[^>]*>\s*<\/database>/gi, "")
    .replace(/###\s*Progress\s*Pic\s*<empty-block\s*\/>/gi, "")
    .replace(/###\s*Notes\s*/gi, "");

  const cleaned = withoutImages
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned || null;
}

async function getPageNotes(pageId: string) {
  const response = await notion.pages.retrieveMarkdown({
    page_id: pageId,
  });

  const markdown = response.markdown ?? "";

  return {
    notes: normalizeNotes(markdown),
    progressPicsUrl: extractProgressPicsUrl(markdown),
  };
}

export async function resolveDataSourceId({
  dataSourceId,
  databaseId,
}: {
  dataSourceId?: string;
  databaseId?: string;
}) {
  if (dataSourceId) {
    return dataSourceId;
  }

  if (!databaseId) {
    throw new Error("Missing Notion database id and data source id");
  }

  const response = (await notion.databases.retrieve({
    database_id: databaseId,
  })) as NotionDatabaseResponse;

  const resolvedDataSourceId = response.data_sources?.[0]?.id;

  if (!resolvedDataSourceId) {
    throw new Error(`No data source found for Notion database ${databaseId}`);
  }

  return resolvedDataSourceId;
}

export async function syncNotionCollection({
  collection,
  dataSourceId,
  databaseId,
  includePageNotes = false,
}: {
  collection: {
    updateOne: (...args: unknown[]) => Promise<unknown>;
    deleteMany: (...args: unknown[]) => Promise<{ deletedCount?: number }>;
  };
  dataSourceId?: string;
  databaseId?: string;
  includePageNotes?: boolean;
}) {
  const resolvedDataSourceId = await resolveDataSourceId({
    dataSourceId,
    databaseId,
  });
  const pages = await queryAllPages(resolvedDataSourceId);
  const syncedAt = new Date();

  const documents = (
    await Promise.all(
      pages.map(async (page) => {
        if (!page.id || !page.properties) {
          return null;
        }

        const { normalized, relationIds, title } = normalizeProperties(page.properties);
        const pageContent = includePageNotes ? await getPageNotes(page.id) : null;

        return {
          notionPageId: page.id,
          title,
          url: page.url ?? null,
          archived: page.archived ?? false,
          inTrash: page.in_trash ?? false,
          createdTime: page.created_time ?? null,
          lastEditedTime: page.last_edited_time ?? null,
          properties: normalized,
          relationIds,
          notes: pageContent?.notes,
          progressPicsUrl: pageContent?.progressPicsUrl,
          updatedAt: syncedAt,
        };
      })
    )
  ).filter((document): document is SyncedNotionDocument => document !== null);

  const syncedIds = documents.map((document) => document.notionPageId);

  for (const document of documents) {
    await collection.updateOne(
      { notionPageId: document.notionPageId },
      {
        $set: document,
        $setOnInsert: {
          createdAt: syncedAt,
        },
      },
      { upsert: true }
    );
  }

  const deletedResult = await collection.deleteMany({
    notionPageId: { $nin: syncedIds },
  });

  return {
    success: true,
    dataSourceId: resolvedDataSourceId,
    count: documents.length,
    deletedCount: deletedResult.deletedCount ?? 0,
  };
}
