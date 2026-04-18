import { describe, expect, it } from "vitest";
import {
  createEmptyTaskForChartType,
  ganttChartTypes,
  getPreviewTasksForChartType,
  getSampleTasksForChartType,
} from "./chartTypes";

describe("gantt chart type presets", () => {
  it("removes roadmap and progress tracking type presets", () => {
    expect(ganttChartTypes.map((type) => type.id)).toEqual([
      "project",
      "milestones",
      "wbs",
    ]);
  });

  it("normalizes milestone charts to date-only markers", () => {
    const milestones = getPreviewTasksForChartType(
      [
        {
          id: "ms-1",
          name: "승인",
          date: "2026-05-10",
          start: "2026-05-01",
          end: "2026-05-15",
          progress: 0,
          critical: true,
          owner: "PM",
          status: "done",
        },
      ],
      "milestones",
    );

    expect(milestones[0]).toMatchObject({
      name: "승인 · PM",
      start: "2026-05-10",
      end: "2026-05-10",
      progress: 100,
      customClass: "milestone-marker-critical-status-done",
    });
  });

  it("uses a compact milestone-only sample and weekly default view", () => {
    const milestoneType = ganttChartTypes.find(
      (type) => type.id === "milestones",
    );
    const sample = getSampleTasksForChartType("milestones");

    expect(milestoneType?.defaultViewMode).toBe("Week");
    expect(sample).toHaveLength(8);
    expect(sample[0]).toMatchObject({
      id: "ms-kickoff",
      date: "2026-04-20",
      section: "기획",
      status: "done",
      dependsOn: [],
    });
    expect(sample.at(-1)).toMatchObject({
      id: "ms-release",
      date: "2026-05-27",
      section: "릴리즈",
      status: "planned",
      dependsOn: ["ms-qa"],
    });
  });

  it("keeps each type sample isolated from caller mutation", () => {
    const firstRead = getSampleTasksForChartType("wbs");

    firstRead[0].name = "변경된 이름";
    firstRead[1].dependsOn?.push("mutated");

    expect(getSampleTasksForChartType("wbs")[0].name).toBe("기획");
    expect(getSampleTasksForChartType("wbs")[1].dependsOn).toEqual([]);
  });

  it("adds code and owner context to WBS preview labels", () => {
    const previewTasks = getPreviewTasksForChartType(
      [
        {
          id: "wbs-1",
          code: "2.1",
          name: "입력 스키마",
          parentId: "",
          nodeType: "task",
          start: "2026-04-24",
          end: "2026-04-30",
          progress: 60,
          owner: "UX",
        },
      ],
      "wbs",
    );

    expect(previewTasks[0]).toMatchObject({
      name: "2.1 입력 스키마 · UX",
      customClass: "wbs-task-row",
    });
  });

  it("marks basic project preview bars as colorable", () => {
    const previewTasks = getPreviewTasksForChartType(
      [
        {
          id: "task-1",
          name: "일정 정리",
          start: "2026-04-20",
          end: "2026-04-24",
          progress: 30,
          owner: "PM",
          color: "#C75D4F",
        },
      ],
      "project",
    );

    expect(previewTasks[0]).toMatchObject({
      name: "일정 정리 · PM",
      color: "#C75D4F",
      customClass: "project-bar-color",
    });
  });

  it("creates type-aware empty tasks for editor tests", () => {
    expect(createEmptyTaskForChartType([], "milestones")).toMatchObject({
      name: "새 마일스톤",
      date: expect.any(String),
      progress: 100,
      dependsOn: [],
      critical: false,
    });

    expect(createEmptyTaskForChartType([], "wbs")).toMatchObject({
      name: "새 작업",
      code: "1",
      nodeType: "task",
      dependsOn: [],
      open: true,
    });
  });
});
