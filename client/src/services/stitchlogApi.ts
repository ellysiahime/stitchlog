export type StitchEntry = {
  date: string;
};

export type NotionOption = {
  id: string | null;
  name: string | null;
  color: string | null;
};

export type NotionDate = {
  start: string;
  end: string | null;
  timeZone: string | null;
};

export type SyncedNotionEntry = {
  notionPageId: string;
  title: string | null;
  url: string | null;
  progressPicsUrl?: string | null;
  archived: boolean;
  inTrash: boolean;
  createdTime: string | null;
  lastEditedTime: string | null;
  updatedAt: string;
  properties: Record<string, unknown>;
  relationIds: Record<string, string[]>;
};

export type FetchStitchesResponse = {
  entries: StitchEntry[];
  lastSyncDate: string | null;
};

export type FetchNotionCollectionResponse = {
  entries: SyncedNotionEntry[];
  lastSyncDate: string | null;
};

export type SyncCollectionResponse = {
  success: boolean;
  count: number;
  deletedCount: number;
  dataSourceId?: string;
};

export type AiChatSource = {
  notionPageId: string;
  title: string | null;
  url: string | null;
  status: string | null;
  fabricCount: string | null;
  categories: string[];
  score?: number;
};

export type AiChatResponse = {
  answer: string;
  sources: AiChatSource[];
};

async function readJson<T>(response: Response, message: string): Promise<T> {
  if (!response.ok) {
    throw new Error(message);
  }

  return response.json();
}

export async function fetchStitches(year: number): Promise<FetchStitchesResponse> {
  const response = await fetch(`/api/stitches?year=${year}`);

  return readJson(response, "Failed to fetch stitches");
}

export async function syncStitches(year: number): Promise<SyncCollectionResponse> {
  const response = await fetch(`/api/sync/stitches?year=${year}`, {
    method: "POST",
  });

  return readJson(response, "Failed to sync stitches");
}

export async function fetchProjects(): Promise<FetchNotionCollectionResponse> {
  const response = await fetch("/api/projects");

  return readJson(response, "Failed to fetch projects");
}

export async function fetchWipgo(): Promise<FetchNotionCollectionResponse> {
  const response = await fetch("/api/wipgo");

  return readJson(response, "Failed to fetch WIPGO");
}

export async function syncProjects(): Promise<SyncCollectionResponse> {
  const response = await fetch("/api/sync/projects", {
    method: "POST",
  });

  return readJson(response, "Failed to sync projects");
}

export async function syncWipgo(): Promise<SyncCollectionResponse> {
  const response = await fetch("/api/sync/wipgo", {
    method: "POST",
  });

  return readJson(response, "Failed to sync WIPGO");
}

export async function askAiChat(message: string): Promise<AiChatResponse> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  return readJson(response, "Failed to get AI chat response");
}
