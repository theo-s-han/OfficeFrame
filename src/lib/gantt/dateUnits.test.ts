import { describe, expect, it } from "vitest";
import {
  getDateUnitInputValue,
  getFrappeRangeEnd,
  getMonthHeaderLabel,
  getQuarterOptionsForRange,
  getTimelineRangeForTasks,
  getWeekOfMonthLabel,
  resolveDateUnitInputValue,
  snapDateToUnit,
} from "./dateUnits";
import type { GanttTask } from "./taskModel";

const tasks: GanttTask[] = [
  {
    id: "task-1",
    name: "기획",
    start: "2026-04-20",
    end: "2026-05-12",
    progress: 20,
  },
];

describe("gantt date unit helpers", () => {
  it("snaps dates to week, month, and quarter boundaries", () => {
    expect(snapDateToUnit("2026-04-22", "Week", "start")).toBe("2026-04-20");
    expect(snapDateToUnit("2026-04-22", "Week", "end")).toBe("2026-04-26");
    expect(snapDateToUnit("2026-04-22", "Month", "start")).toBe("2026-04-01");
    expect(snapDateToUnit("2026-04-22", "Quarter", "end")).toBe("2026-06-30");
  });

  it("formats and resolves date unit input values", () => {
    expect(getDateUnitInputValue("2026-04-20", "Week")).toBe("2026-W17");
    expect(getDateUnitInputValue("2026-04-20", "Month")).toBe("2026-04");
    expect(getDateUnitInputValue("2026-04-20", "Quarter")).toBe("2026-Q2");
    expect(resolveDateUnitInputValue("2026-W17", "Week", "end")).toBe(
      "2026-04-26",
    );
    expect(resolveDateUnitInputValue("2026-04", "Month", "end")).toBe(
      "2026-04-30",
    );
    expect(resolveDateUnitInputValue("2026-Q2", "Quarter", "start")).toBe(
      "2026-04-01",
    );
  });

  it("derives timeline ranges from task dates instead of the current date", () => {
    expect(getTimelineRangeForTasks(tasks, "Quarter")).toEqual({
      start: "2026-04-01",
      end: "2026-06-30",
    });
    expect(getFrappeRangeEnd("2026-06-30", "Quarter")).toBe("2026-09-30");
  });

  it("creates quarter options around the selected range and task dates", () => {
    const options = getQuarterOptionsForRange(
      {
        start: "2026-04-01",
        end: "2026-06-30",
      },
      tasks,
    );

    expect(options).toContainEqual({
      value: "2026-Q2",
      label: "2026년 2분기",
    });
  });

  it("formats week headers as week-of-month under the month", () => {
    expect(getMonthHeaderLabel(new Date("2026-01-05T00:00:00"))).toBe("1월");
    expect(getWeekOfMonthLabel(new Date("2026-01-05T00:00:00"))).toBe("1주");
    expect(getWeekOfMonthLabel(new Date("2026-01-19T00:00:00"))).toBe("3주");
  });
});
