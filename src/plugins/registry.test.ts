import { describe, expect, it } from "vitest";
import {
  getActiveTools,
  getPublicTools,
  getToolById,
  toolRegistry,
} from "./registry";

describe("toolRegistry", () => {
  it("returns only public active tools from the public registry", () => {
    const activeTools = getPublicTools();

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

    expect(activeTools.map((tool) => tool.id)).not.toContain("pose");
  });

  it("keeps hidden tools registered without exposing them publicly", () => {
    expect(toolRegistry.every((tool) => tool.status === "active")).toBe(true);
    expect(getActiveTools().map((tool) => tool.id)).toContain("pose");
    expect(getToolById("pose")).toMatchObject({
      id: "pose",
      status: "active",
      visibility: "internal",
      href: "/pose",
    });
  });

  it("finds registered tools by id", () => {
    expect(getToolById("gantt")?.href).toBe("/gantt");
    expect(getToolById("mindmap")?.href).toBe("/mindmap");
    expect(getToolById("org-chart")?.href).toBe("/org-chart");
    expect(getToolById("flowchart")?.href).toBe("/flowchart");
    expect(getToolById("timeline")?.href).toBe("/timeline");
    expect(getToolById("pose")?.href).toBe("/pose");
    expect(getToolById("missing")).toBeUndefined();
  });
});
