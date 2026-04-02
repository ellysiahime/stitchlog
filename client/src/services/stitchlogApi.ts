export type StitchEntry = {
  date: string;
};

export type SyncStitchesResponse = {
  success: boolean;
  count: number;
};

export async function fetchStitches(year: number): Promise<StitchEntry[]> {
  const response = await fetch(`/api/stitches?year=${year}`);

  if (!response.ok) {
    throw new Error("Failed to fetch stitches");
  }

  return response.json();
}

export async function syncStitches(year: number): Promise<SyncStitchesResponse> {
  const response = await fetch(`/api/sync/stitches?year=${year}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to sync stitches");
  }

  return response.json();
}