import { describe, expect, it } from "vitest";
import {
  getGanttTaskPaletteIndex,
  getTaskColorAssignmentKey,
  resolveGanttTaskVisual,
} from "./taskColorResolver";
import { defaultGanttPalette } from "./theme";
import type { GanttTask } from "./taskModel";

function createTask(patch: Partial<GanttTask>): GanttTask {
  return {
    id: patch.id ?? "task-1",
    name: patch.name ?? "Task",
    start: patch.start ?? "2026-04-20",
    end: patch.end ?? "2026-04-24",
    progress: patch.progress ?? 0,
    ...patch,
  };
}

describe("gantt task color resolver", () => {
  it("keeps the same palette color for tasks in the same phase", () => {
    const first = createTask({ id: "task-a", phase: "Design" });
    const second = createTask({ id: "task-b", phase: "Design" });

    expect(getTaskColorAssignmentKey(first)).toBe("Design");
    expect(getGanttTaskPaletteIndex(first)).toBe(
      getGanttTaskPaletteIndex(second),
    );
    expect(resolveGanttTaskVisual(first).baseColor).toBe(
      resolveGanttTaskVisual(second).baseColor,
    );
  });

  it("uses a stable hash fallback when grouping fields are missing", () => {
    const task = createTask({ id: "task-stable" });

    expect(resolveGanttTaskVisual(task)).toMatchObject({
      baseColor: defaultGanttPalette.taskColors[getGanttTaskPaletteIndex(task)],
      colorSource: "task-palette",
    });
  });

  it("separates manual, semantic, group, and milestone colors", () => {
    expect(
      resolveGanttTaskVisual(createTask({ color: "#a65d7b" })),
    ).toMatchObject({
      baseColor: "#A65D7B",
      colorSource: "manual",
    });
    expect(
      resolveGanttTaskVisual(createTask({ status: "blocked" })),
    ).toMatchObject({
      baseColor: defaultGanttPalette.semantic.danger,
      colorSource: "semantic-danger",
    });
    expect(
      resolveGanttTaskVisual(createTask({ nodeType: "group" })),
    ).toMatchObject({
      baseColor: defaultGanttPalette.neutral.groupBar,
      colorSource: "group",
    });
    expect(
      resolveGanttTaskVisual(createTask({ nodeType: "milestone" })),
    ).toMatchObject({
      baseColor: defaultGanttPalette.semantic.milestone,
      colorSource: "milestone",
    });
  });
});
