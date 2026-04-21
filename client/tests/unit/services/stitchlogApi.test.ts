import { fetchStitches, syncStitches } from "@/services/stitchlogApi";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("stitchlogApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches stitches for a selected year", async () => {
    const responsePayload = {
      entries: [{ date: "2026-04-16" }],
      lastSyncDate: "2026-04-21T00:00:00.000Z",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => responsePayload,
    } as Response);

    await expect(fetchStitches(2026)).resolves.toEqual(responsePayload);
    expect(fetchMock).toHaveBeenCalledWith("/api/stitches?year=2026");
  });

  it("throws when stitch fetching fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
    } as Response);

    await expect(fetchStitches(2026)).rejects.toThrow("Failed to fetch stitches");
  });

  it("posts to the sync endpoint for the selected year", async () => {
    const responsePayload = { success: true, count: 2 };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => responsePayload,
    } as Response);

    await expect(syncStitches(2026)).resolves.toEqual(responsePayload);
    expect(fetchMock).toHaveBeenCalledWith("/api/sync/stitches?year=2026", {
      method: "POST",
    });
  });
});
