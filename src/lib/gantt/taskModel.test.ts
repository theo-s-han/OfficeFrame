import { describe, expect, it } from "vitest";
import {
  addGanttTask,
  applyGanttDateChange,
  applyGanttProgressChange,
  applySafeGanttDatePatch,
  createGanttDebugSnapshot,
  getValidPreviewTasks,
  isValidGanttTaskColor,
  isValidDateObject,
  normalizeGanttTaskColor,
  removeGanttTask,
  updateGanttTask,
  validateGanttTasks,
  type GanttTask,
} from "./taskModel";

const tasks: GanttTask[] = [
  {
    id: "task-1",
    name: "기획",
    start: "2026-04-20",
    end: "2026-04-24",
    progress: 20,
  },
];

describe("gantt task model test entry points", () => {
  it("adds, updates, and removes tasks without UI", () => {
    const added = addGanttTask(tasks, {
      id: "task-2",
      name: "구현",
      start: "2026-04-25",
      end: "2026-04-30",
      progress: 0,
    });
    const updated = updateGanttTask(added, "task-2", { progress: 45 });
    const removed = removeGanttTask(updated, "task-1");

    expect(removed).toEqual([
      {
        id: "task-2",
        name: "구현",
        start: "2026-04-25",
        end: "2026-04-30",
        progress: 45,
      },
    ]);
  });

  it("applies chart drag results to task dates and progress", () => {
    const dateChanged = applyGanttDateChange(
      tasks,
      "task-1",
      new Date("2026-05-01T00:00:00"),
      new Date("2026-05-03T23:59:59"),
    );
    const progressChanged = applyGanttProgressChange(
      dateChanged,
      "task-1",
      110,
    );

    expect(progressChanged[0]).toMatchObject({
      start: "2026-05-01",
      end: "2026-05-03",
      progress: 100,
    });
  });

  it("keeps previous task dates when chart drag returns invalid values", () => {
    const invalidDateResult = applySafeGanttDatePatch(
      tasks,
      "task-1",
      "NaN-NaN-NaN",
      "2026-05-03",
    );
    const reversedDateResult = applySafeGanttDatePatch(
      tasks,
      "task-1",
      "2026-05-10",
      "2026-05-01",
    );

    expect(invalidDateResult).toMatchObject({
      applied: false,
      tasks,
      reason: "invalid_date",
    });
    expect(reversedDateResult).toMatchObject({
      applied: false,
      tasks,
      reason: "end_before_start",
    });
    expect(isValidDateObject(new Date("invalid"))).toBe(false);
  });

  it("reports validation issues and filters invalid preview tasks", () => {
    const invalidTasks: GanttTask[] = [
      {
        id: "task-1",
        name: "",
        start: "2026-05-10",
        end: "2026-05-01",
        progress: 120,
      },
    ];

    expect(validateGanttTasks(invalidTasks)).toHaveLength(3);
    expect(getValidPreviewTasks(invalidTasks)).toEqual([]);
  });

  it("normalizes and validates HEX task colors", () => {
    expect(normalizeGanttTaskColor("#c75d4f")).toBe("#C75D4F");
    expect(normalizeGanttTaskColor("not-a-color")).toBe("#14745F");
    expect(isValidGanttTaskColor("#4F6FAA")).toBe(true);
    expect(isValidGanttTaskColor("coral")).toBe(false);
    expect(
      validateGanttTasks([
        {
          id: "task-1",
          name: "기획",
          start: "2026-04-20",
          end: "2026-04-24",
          progress: 20,
          color: "coral",
        },
      ]),
    ).toEqual([
      {
        taskId: "task-1",
        field: "color",
        message: "색상은 #RRGGBB 형식이어야 합니다.",
      },
    ]);
  });

  it("creates a compact debug snapshot for Codex inspection", () => {
    const snapshot = createGanttDebugSnapshot({
      tasks,
      chartType: "project",
      viewMode: "Week",
      timelineStart: "2026-04-20",
      timelineEnd: "2026-04-26",
      backgroundTemplate: "clean",
      selectedTaskId: "task-1",
    });

    expect(snapshot).toMatchObject({
      taskCount: 1,
      validTaskCount: 1,
      issueCount: 0,
      chartType: "project",
      viewMode: "Week",
      timelineStart: "2026-04-20",
      timelineEnd: "2026-04-26",
      backgroundTemplate: "clean",
      selectedTaskId: "task-1",
    });
  });
});
