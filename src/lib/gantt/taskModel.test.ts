import { describe, expect, it } from "vitest";
import {
  addGanttTask,
  applyGanttDateChange,
  applyGanttProgressChange,
  applySafeGanttDatePatch,
  createGanttDebugSnapshot,
  defaultProjectMonthColumnWidth,
  defaultProjectWeekColumnWidth,
  getValidPreviewTasks,
  isValidDateObject,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
  removeGanttTask,
  updateGanttTask,
  updateGanttTaskId,
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

  it("updates task ids and keeps references connected", () => {
    const updated = updateGanttTaskId(
      [
        {
          id: "parent",
          name: "Parent",
          start: "",
          end: "",
          progress: 0,
        },
        {
          id: "child",
          name: "Child",
          parentId: "parent",
          start: "2026-05-01",
          end: "2026-05-02",
          progress: 0,
          dependsOn: ["parent"],
        },
      ],
      "parent",
      "renamed-parent",
    );

    expect(updated[1]).toMatchObject({
      parentId: "renamed-parent",
      dependsOn: ["renamed-parent"],
    });
  });

  it("applies chart drag results to task dates and progress", () => {
    const dateChanged = applyGanttDateChange(
      tasks,
      "task-1",
      new Date("2026-05-01T00:00:00"),
      new Date("2026-05-03T23:59:59"),
    );
    const progressChanged = applyGanttProgressChange(dateChanged, "task-1", 110);

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
    expect(normalizeGanttTaskColor("not-a-color")).toBe("#5B6EE1");
    expect(isValidGanttTaskColor("#2F7E9E")).toBe(true);
    expect(isValidGanttTaskColor("coral")).toBe(false);
  });

  it("validates milestone ids, dates, dependencies, and statuses", () => {
    const milestoneIssues = validateGanttTasks(
      [
        {
          id: "ms-1",
          name: "범위 승인",
          date: "",
          start: "",
          end: "",
          progress: 100,
          dependsOn: ["missing"],
        },
        {
          id: "ms-1",
          name: "릴리즈",
          date: "2026-05-01",
          start: "2026-05-01",
          end: "2026-05-01",
          progress: 100,
          status: "blocked",
          dependsOn: ["ms-1"],
        },
      ],
      "milestones",
    );

    expect(milestoneIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "date" }),
        expect.objectContaining({ field: "id" }),
        expect.objectContaining({
          field: "dependsOn",
          message: "존재하지 않는 의존성 ID입니다.",
        }),
        expect.objectContaining({
          field: "dependsOn",
          message: "자기 자신을 dependsOn으로 참조할 수 없습니다.",
        }),
        expect.objectContaining({
          field: "status",
        }),
      ]),
    );
  });

  it("rejects WBS invalid parents, cycles, and unsupported statuses", () => {
    const wbsIssues = validateGanttTasks(
      [
        {
          id: "group-1",
          name: "기획",
          parentId: "missing-parent",
          start: "",
          end: "",
          progress: 0,
        },
        {
          id: "task-1",
          name: "작업",
          parentId: "task-2",
          start: "",
          end: "",
          progress: 0,
          status: "blocked",
        },
        {
          id: "task-2",
          name: "하위 작업",
          parentId: "task-1",
          start: "",
          end: "",
          progress: 0,
        },
      ],
      "wbs",
    );

    expect(wbsIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: "group-1",
          field: "parentId",
        }),
        expect.objectContaining({
          taskId: "task-1",
          field: "status",
          message:
            "WBS 상태는 not-started, in-progress, done만 사용할 수 있습니다.",
        }),
        expect.objectContaining({
          taskId: "task-1",
          field: "parentId",
          message: "순환 구조는 허용되지 않습니다.",
        }),
        expect.objectContaining({
          taskId: "task-2",
          field: "parentId",
          message: "순환 구조는 허용되지 않습니다.",
        }),
      ]),
    );
  });

  it("creates a compact debug snapshot for Codex inspection", () => {
    const snapshot = createGanttDebugSnapshot({
      tasks,
      chartType: "project",
      viewMode: "Week",
      timelineStart: "2026-04-20",
      timelineEnd: "2026-04-26",
      backgroundTemplate: "clean",
      weekColumnWidth: defaultProjectWeekColumnWidth,
      monthColumnWidth: defaultProjectMonthColumnWidth,
      wbsProjectName: "오피스 툴",
      wbsStructureType: "deliverable",
      selectedTaskId: "task-1",
    });

    expect(snapshot).toMatchObject({
      taskCount: 1,
      validTaskCount: 1,
      issueCount: 0,
      chartType: "project",
      wbsProjectName: "오피스 툴",
      wbsStructureType: "deliverable",
    });
  });
});

