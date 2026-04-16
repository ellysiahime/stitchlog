import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateStitchStats } from "@/utils/stats";

describe("calculateStitchStats", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the streak alive through today when the latest entry was yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T12:00:00"));

    const stats = calculateStitchStats([
      { date: "2026-04-15" },
      { date: "2026-04-16" },
    ]);

    expect(stats.currentStreak).toBe(2);
  });

  it("shows a streak of one when only yesterday has an entry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T12:00:00"));

    const stats = calculateStitchStats([{ date: "2026-04-15" }]);

    expect(stats.currentStreak).toBe(1);
  });

  it("still counts from today when today has an entry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T12:00:00"));

    const stats = calculateStitchStats([
      { date: "2026-04-15" },
      { date: "2026-04-16" },
    ]);

    expect(stats.currentStreak).toBe(2);
  });

  it("tracks total sessions, distinct days, and longest streak independently", () => {
    const stats = calculateStitchStats([
      { date: "2026-04-10" },
      { date: "2026-04-10" },
      { date: "2026-04-11" },
      { date: "2026-04-13" },
    ]);

    expect(stats.totalSessions).toBe(4);
    expect(stats.totalDaysStitched).toBe(3);
    expect(stats.longestStreak).toBe(2);
  });
});
