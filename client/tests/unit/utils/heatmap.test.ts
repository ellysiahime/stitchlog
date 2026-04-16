import {
  buildHeatmapData,
  generateYearDays,
  getLevel,
  getMonthLabels,
  groupDaysIntoWeeks,
} from "@/utils/heatmap";
import { describe, expect, it } from "vitest";

describe("heatmap utils", () => {
  it("aggregates multiple entries on the same day", () => {
    expect(
      buildHeatmapData([
        { date: "2026-04-15" },
        { date: "2026-04-15" },
        { date: "2026-04-16" },
      ])
    ).toEqual({
      "2026-04-15": 2,
      "2026-04-16": 1,
    });
  });

  it("maps entry counts to visual intensity levels", () => {
    expect([0, 1, 2, 3, 4, 8].map(getLevel)).toEqual([0, 1, 2, 3, 4, 4]);
  });

  it("creates one day per date in the selected year", () => {
    const days = generateYearDays(2026, [{ date: "2026-04-15" }]);

    expect(days).toHaveLength(365);
    expect(days[0]).toMatchObject({ date: "2026-01-01", count: 0 });
    expect(days.find((day) => day.date === "2026-04-15")).toMatchObject({
      date: "2026-04-15",
      count: 1,
      level: 1,
    });
  });

  it("pads incomplete weeks so the grid stays aligned", () => {
    const weeks = groupDaysIntoWeeks(generateYearDays(2026, []));

    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0].date).toBe("");
  });

  it("shows month labels only when a new month starts in the week grid", () => {
    const labels = getMonthLabels(groupDaysIntoWeeks(generateYearDays(2026, [])));

    expect(labels[0]).toBe("Jan");
    expect(labels).toContain("Feb");
    expect(labels.filter((label) => label === "Jan")).toHaveLength(1);
  });
});
