import { describe, expect, it, vi } from "vitest";
import {
  createGanttDebugPayload,
  isGanttDebugRequested,
  recordGanttDebugEvent,
} from "./debug";

describe("gantt debug mode", () => {
  it("is opt-in through query string or local storage value", () => {
    expect(isGanttDebugRequested("?debug=gantt")).toBe(true);
    expect(isGanttDebugRequested("", "true")).toBe(true);
    expect(isGanttDebugRequested("?debug=other", "false")).toBe(false);
  });

  it("does not record logs when disabled", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    expect(recordGanttDebugEvent(false, "state.snapshot")).toBeNull();
    expect(debugSpy).not.toHaveBeenCalled();

    debugSpy.mockRestore();
  });

  it("creates a small payload from a debug snapshot", () => {
    expect(
      createGanttDebugPayload({
        taskCount: 2,
        validTaskCount: 1,
        issueCount: 1,
        chartType: "wbs",
        viewMode: "Month",
        timelineStart: "2026-04-01",
        timelineEnd: "2026-04-30",
        backgroundTemplate: "clean",
        weekColumnWidth: 96,
        monthColumnWidth: 120,
        wbsProjectName: "오피스 툴",
        wbsStructureType: "deliverable",
        tasks: [],
      }),
    ).toEqual({
      taskCount: 2,
      validTaskCount: 1,
      issueCount: 1,
      chartType: "wbs",
      viewMode: "Month",
      timelineStart: "2026-04-01",
      timelineEnd: "2026-04-30",
      backgroundTemplate: "clean",
      weekColumnWidth: 96,
      monthColumnWidth: 120,
    });
  });
});
