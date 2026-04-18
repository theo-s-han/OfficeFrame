import { describe, expect, it } from "vitest";
import { getActiveTools, getToolById, toolRegistry } from "./registry";

describe("toolRegistry", () => {
  it("registers gantt as the only active tool", () => {
    const activeTools = getActiveTools();

    expect(activeTools).toHaveLength(1);
    expect(activeTools[0]).toMatchObject({
      id: "gantt",
      status: "active",
      href: "/gantt",
    });
  });

  it("keeps future tools visible as placeholders", () => {
    const placeholders = toolRegistry.filter(
      (tool) => tool.status === "placeholder",
    );

    expect(placeholders.map((tool) => tool.id)).toEqual([
      "mindmap",
      "org-chart",
      "flowchart",
      "timeline",
    ]);
  });

  it("finds registered tools by id", () => {
    expect(getToolById("gantt")?.name).toBe("간트 차트");
    expect(getToolById("missing")).toBeUndefined();
  });
});
