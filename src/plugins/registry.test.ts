import { describe, expect, it } from "vitest";
import { getActiveTools, getToolById, toolRegistry } from "./registry";

describe("toolRegistry", () => {
  it("registers gantt and mindmap as active tools", () => {
    const activeTools = getActiveTools();

    expect(activeTools).toHaveLength(2);
    expect(activeTools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "gantt",
          status: "active",
          href: "/gantt",
        }),
        expect.objectContaining({
          id: "mindmap",
          status: "active",
          href: "/mindmap",
        }),
      ]),
    );
  });

  it("keeps future tools visible as placeholders", () => {
    const placeholders = toolRegistry.filter(
      (tool) => tool.status === "placeholder",
    );

    expect(placeholders.map((tool) => tool.id)).toEqual([
      "org-chart",
      "flowchart",
      "timeline",
    ]);
  });

  it("finds registered tools by id", () => {
    expect(getToolById("gantt")?.name).toBe("간트 차트");
    expect(getToolById("mindmap")?.name).toBe("마인드맵");
    expect(getToolById("missing")).toBeUndefined();
  });
});
