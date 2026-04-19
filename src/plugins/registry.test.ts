import { describe, expect, it } from "vitest";
import { getActiveTools, getToolById, toolRegistry } from "./registry";

describe("toolRegistry", () => {
  it("registers all current document tools as active", () => {
    const activeTools = getActiveTools();

    expect(activeTools).toHaveLength(5);
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
        expect.objectContaining({
          id: "org-chart",
          status: "active",
          href: "/org-chart",
        }),
        expect.objectContaining({
          id: "flowchart",
          status: "active",
          href: "/flowchart",
        }),
        expect.objectContaining({
          id: "timeline",
          status: "active",
          href: "/timeline",
        }),
      ]),
    );
  });

  it("keeps every registered tool available from the home registry", () => {
    expect(toolRegistry.every((tool) => tool.status === "active")).toBe(true);
  });

  it("finds registered tools by id", () => {
    expect(getToolById("gantt")?.href).toBe("/gantt");
    expect(getToolById("mindmap")?.href).toBe("/mindmap");
    expect(getToolById("org-chart")?.href).toBe("/org-chart");
    expect(getToolById("flowchart")?.href).toBe("/flowchart");
    expect(getToolById("timeline")?.href).toBe("/timeline");
    expect(getToolById("missing")).toBeUndefined();
  });
});
