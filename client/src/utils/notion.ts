import type { NotionOption, SyncedNotionEntry } from "@/services/stitchlogApi";

export function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function getOptionName(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return getStringValue((value as NotionOption).name);
}

export function getRelationId(entry: SyncedNotionEntry, relationName: string) {
  return entry.relationIds[relationName]?.[0] ?? null;
}

export function getProjectName(entry: SyncedNotionEntry) {
  return getStringValue(entry.title) ?? getStringValue(entry.properties.Pattern) ?? "Untitled project";
}

export function formatLastSyncDate(dateString: string | null) {
  if (!dateString) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatShortDate(dateString: string | null) {
  if (!dateString) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function getLatestSyncDate(...dates: Array<string | null>) {
  const validDates = dates.filter((date): date is string => Boolean(date));

  if (validDates.length === 0) {
    return null;
  }

  return [...validDates].sort().at(-1) ?? null;
}
