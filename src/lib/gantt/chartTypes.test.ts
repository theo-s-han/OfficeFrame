import { describe, expect, it } from "vitest";
import {
  createEmptyTaskForChartType,
  getPreviewTasksForChartType,
  getSampleTasksForChartType,
} from "./chartTypes";

describe("gantt chart type presets", () => {
  it("normalizes milestone charts to date-only markers", () => {
    const milestones = getPreviewTasksForChartType(
      [
        {
          id: "task-1",
          name: "승인",
          start: "2026-05-10",
          end: "2026-05-15",
          progress: 0,
        },
      ],
      "milestones",
    );

    expect(milestones[0]).toMatchObject({
      start: "2026-05-10",
      end: "2026-05-10",
      progress: 100,
      customClass: "milestone-marker",
    });
  });

  it("keeps each type sample isolated from caller mutation", () => {
    const firstRead = getSampleTasksForChartType("wbs");

    firstRead[0].name = "변경된 이름";

    expect(getSampleTasksForChartType("wbs")[0].name).toBe(
      "사용자 시나리오 정리",
    );
  });

  it("adds phase context to WBS preview labels", () => {
    const previewTasks = getPreviewTasksForChartType(
      [
        {
          id: "task-1",
          phase: "2. 설계",
          name: "입력 스키마",
          start: "2026-04-24",
          end: "2026-04-30",
          progress: 60,
        },
      ],
      "wbs",
    );

    expect(previewTasks[0]).toMatchObject({
      name: "2. 설계 / 입력 스키마",
      customClass: "wbs-bar",
    });
  });

  it("adds color classes to basic project preview labels", () => {
    const previewTasks = getPreviewTasksForChartType(
      [
        {
          id: "task-1",
          name: "일정 정리",
          start: "2026-04-20",
          end: "2026-04-24",
          progress: 30,
          owner: "PM",
          color: "coral",
        },
      ],
      "project",
    );

    expect(previewTasks[0]).toMatchObject({
      name: "일정 정리 · PM",
      customClass: "project-bar-color-coral",
    });
  });

  it("keeps basic project sample colors editable", () => {
    expect(getSampleTasksForChartType("project")[0]).toMatchObject({
      color: "emerald",
    });
  });

  it("adds baseline rows to progress tracking previews", () => {
    const previewTasks = getPreviewTasksForChartType(
      [
        {
          id: "task-1",
          name: "구현",
          start: "2026-05-01",
          end: "2026-05-08",
          progress: 40,
          baselineStart: "2026-04-29",
          baselineEnd: "2026-05-05",
          status: "at-risk",
        },
      ],
      "progress",
    );

    expect(previewTasks).toHaveLength(2);
    expect(previewTasks[0]).toMatchObject({
      id: "task-1-baseline",
      previewSourceId: "task-1",
      previewDateTarget: "readonly",
      start: "2026-04-29",
      end: "2026-05-05",
      customClass: "baseline-bar",
    });
    expect(previewTasks[1]).toMatchObject({
      id: "task-1",
      name: "실제: 구현",
      customClass: "progress-tracking-bar-status-at-risk",
    });
  });

  it("creates type-aware empty tasks for editor tests", () => {
    expect(createEmptyTaskForChartType([], "milestones")).toMatchObject({
      name: "새 마일스톤",
      progress: 100,
      customClass: "milestone-marker",
    });

    expect(createEmptyTaskForChartType([], "roadmap")).toMatchObject({
      name: "새 로드맵 항목",
      phase: "영역",
      status: "planned",
    });

    expect(createEmptyTaskForChartType([], "progress")).toMatchObject({
      name: "새 추적 작업",
      status: "planned",
      baselineStart: expect.any(String),
    });
  });
});
