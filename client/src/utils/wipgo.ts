import type { SyncedNotionEntry } from "@/services/stitchlogApi";
import { getOptionName, getProjectName, getRelationId, getStringValue } from "@/utils/notion";

export type WipgoTile = {
  notionPageId: string;
  number: string;
  numberValue: number;
  goal: string;
  status: string;
  projectName: string;
  monthCalled: string | null;
  isCompleted: boolean;
  isTodo: boolean;
  hasLinkedProject: boolean;
  url: string | null;
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function isCompletedStatus(status: string) {
  return normalizeStatus(status) === "completed";
}

function isTodoStatus(status: string) {
  return ["to do", "todo", "not started", "open"].includes(normalizeStatus(status));
}

function getWipgoNumber(entry: SyncedNotionEntry) {
  const rawValue =
    getStringValue(entry.properties.WIPGO) ??
    getStringValue(entry.title) ??
    getStringValue(entry.properties.Number) ??
    "0";
  const parsed = Number.parseInt(rawValue, 10);

  return {
    number: rawValue.padStart(2, "0"),
    numberValue: Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed,
  };
}

export function buildWipgoTiles(
  wipgoEntries: SyncedNotionEntry[],
  projectEntries: SyncedNotionEntry[]
) {
  const projectMap = new Map(projectEntries.map((entry) => [entry.notionPageId, entry]));

  return wipgoEntries
    .map((entry) => {
      const { number, numberValue } = getWipgoNumber(entry);
      const status = getOptionName(entry.properties.Status) ?? "Not started";
      const projectId = getRelationId(entry, "Project");
      const linkedProject = projectId ? projectMap.get(projectId) : null;
      const isCompleted = isCompletedStatus(status);
      const isTodo = !isCompleted && isTodoStatus(status);

      return {
        notionPageId: entry.notionPageId,
        number,
        numberValue,
        goal: getStringValue(entry.properties.Goal) ?? "Goal coming soon",
        status,
        projectName: linkedProject ? getProjectName(linkedProject) : "N/A",
        monthCalled: getOptionName(entry.properties["Month Called"]),
        isCompleted,
        isTodo,
        hasLinkedProject: Boolean(linkedProject),
        url: entry.url,
      } satisfies WipgoTile;
    })
    .sort((left, right) => left.numberValue - right.numberValue);
}
