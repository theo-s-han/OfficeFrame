import { describe, expect, it } from "vitest";
import {
  buildMindElixirData,
  countMindmapNodes,
  createMindmapNode,
  createSampleMindmap,
  flattenMindmap,
  getMindmapDepth,
  getNextMindmapId,
  getSuggestedMindmapColor,
  insertMindmapChild,
  insertMindmapSibling,
  removeMindmapNode,
  updateMindmapNode,
  validateMindmap,
} from "./model";

describe("mindmap model", () => {
  it("creates a stable sample tree", () => {
    const sample = createSampleMindmap();

    expect(countMindmapNodes(sample)).toBeGreaterThanOrEqual(10);
    expect(getMindmapDepth(sample)).toBe(3);
    expect(flattenMindmap(sample)[0]?.topic).toBe("문서형 업무 도구");
  });

  it("adds child and sibling nodes to the expected hierarchy", () => {
    const sample = createSampleMindmap();
    const childNode = createMindmapNode({
      id: getNextMindmapId(sample),
      topic: "신규 하위",
      color: getSuggestedMindmapColor(sample, "mind-goal"),
    });
    const withChild = insertMindmapChild(sample, "mind-goal", childNode);

    expect(flattenMindmap(withChild).some((node) => node.id === childNode.id)).toBe(
      true,
    );

    const siblingNode = createMindmapNode({
      id: getNextMindmapId(withChild),
      topic: "신규 형제",
      color: getSuggestedMindmapColor(withChild, "mind-root"),
    });
    const withSibling = insertMindmapSibling(withChild, "mind-input", siblingNode);
    const topLevelNodes = withSibling.children.map((node) => node.id);

    expect(topLevelNodes).toContain(siblingNode.id);
    expect(topLevelNodes.indexOf(siblingNode.id)).toBe(
      topLevelNodes.indexOf("mind-input") + 1,
    );
  });

  it("updates and removes nodes safely", () => {
    const sample = createSampleMindmap();
    const updated = updateMindmapNode(sample, "mind-preview-export", {
      topic: "PNG export 확인",
    });

    expect(
      flattenMindmap(updated).find((node) => node.id === "mind-preview-export")
        ?.topic,
    ).toBe("PNG export 확인");

    const removed = removeMindmapNode(updated, "mind-preview-export");

    expect(
      flattenMindmap(removed).some((node) => node.id === "mind-preview-export"),
    ).toBe(false);
  });

  it("validates empty topic and invalid color", () => {
    const sample = createSampleMindmap();
    const invalid = updateMindmapNode(sample, "mind-goal", {
      topic: " ",
    });
    const invalidColor = updateMindmapNode(invalid, "mind-input", {});
    const inputNode = invalidColor.children.find((node) => node.id === "mind-input");

    if (inputNode) {
      inputNode.color = "#12345";
    }

    const issues = validateMindmap(invalidColor);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: "mind-goal",
          field: "topic",
        }),
        expect.objectContaining({
          nodeId: "mind-input",
          field: "color",
        }),
      ]),
    );
  });

  it("converts the tree to Mind Elixir data", () => {
    const sample = createSampleMindmap();
    const data = buildMindElixirData(sample);

    expect(data.direction).toBe(2);
    expect(data.nodeData.topic).toBe("문서형 업무 도구");
    expect(data.nodeData.children).toHaveLength(4);
  });
});
