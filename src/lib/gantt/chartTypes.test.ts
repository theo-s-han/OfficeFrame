import { describe, expect, it } from "vitest";
import {
  createEmptyTaskForChartType,
  ganttChartTypes,
  getDefaultWbsProjectName,
  getDefaultWbsStructureType,
  getPreviewTasksForChartType,
  getSampleTasksForChartType,
} from "./chartTypes";

describe("gantt chart type presets", () => {
  it("keeps only project, milestone, and WBS presets", () => {
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

  it("uses the new WBS Tree copy and sample data", () => {
    const wbsType = ganttChartTypes.find((type) => type.id === "wbs");
    const sample = getSampleTasksForChartType("wbs");

    expect(wbsType).toMatchObject({
      name: "WBS Tree",
      editorTitle: "WBS Tree 입력",
      previewTitle: "WBS Tree preview",
      dependenciesLabel: "상위 항목",
    });
    expect(sample).toHaveLength(9);
    expect(sample[0]).toMatchObject({
      id: "wbs-discovery",
      name: "요구 분석",
      status: "in-progress",
    });
    expect(sample[1]).toMatchObject({
      parentId: "wbs-discovery",
      status: "done",
    });
  });

  it("keeps each type sample isolated from caller mutation", () => {
    const firstRead = getSampleTasksForChartType("wbs");

    firstRead[0].name = "변경된 이름";

    expect(getSampleTasksForChartType("wbs")[0].name).toBe("요구 분석");
  });

  it("creates type-aware empty tasks for editor tests", () => {
    expect(createEmptyTaskForChartType([], "milestones")).toMatchObject({
      name: "새 마일스톤",
      date: expect.any(String),
      progress: 100,
      section: "기획",
      dependsOn: [],
    });

    expect(createEmptyTaskForChartType([], "wbs")).toMatchObject({
      name: "새 항목",
      parentId: "",
      status: "not-started",
      notes: "",
    });
  });

  it("provides WBS defaults through helpers", () => {
    expect(getDefaultWbsProjectName()).toBe("오피스 툴 구축");
    expect(getDefaultWbsStructureType()).toBe("deliverable");
  });
});

