import { describe, expect, it } from "vitest";
import {
  getWbsTreeContentExportFrame,
  defaultWbsTreeExportPadding,
  defaultWbsTreeNodeSize,
  defaultWbsTreeSeparation,
  defaultWbsTreeZoom,
  getWbsTreeExportFrame,
  getWbsTreeNodeLayout,
  getWbsTreeNodeSize,
  getWbsTextLineLimit,
  getWbsTreePreviewTransform,
  splitWbsPreviewLines,
} from "./wbsTreePreviewLayout";

describe("wbsTreePreviewLayout", () => {
  it("expands owner and notes rows without overlapping the card content", () => {
    const layout = getWbsTreeNodeLayout({
      isRoot: false,
      noteLineCount: 3,
      ownerLineCount: 2,
      titleLineCount: 3,
    });

    expect(layout.cardHeight).toBeGreaterThan(180);
    expect(layout.kindY).toBeGreaterThan(layout.titleY + layout.titleLineHeight * 2);
    expect(layout.ownerY).not.toBeNull();
    expect(layout.noteY).not.toBeNull();
    expect(layout.ownerY).toBeGreaterThan(layout.kindY);
    expect(layout.noteY).toBeGreaterThan(layout.ownerY ?? 0);
    expect(layout.ownerLineCount).toBe(2);
    expect(layout.noteLineCount).toBe(3);
  });

  it("keeps the project root compact and ignores child-only rows", () => {
    const layout = getWbsTreeNodeLayout({
      isRoot: true,
      noteLineCount: 3,
      ownerLineCount: 2,
      titleLineCount: 2,
    });

    expect(layout.cardWidth).toBeGreaterThan(280);
    expect(layout.cardHeight).toBeLessThan(130);
    expect(layout.ownerY).toBeNull();
    expect(layout.noteY).toBeNull();
    expect(layout.ownerLineCount).toBe(0);
    expect(layout.noteLineCount).toBe(0);
  });

  it("returns the shared preview transform and spacing defaults", () => {
    expect(getWbsTreePreviewTransform(1200)).toEqual({
      x: 600,
      y: 96,
    });
    expect(defaultWbsTreeNodeSize).toEqual({ x: 340, y: 244 });
    expect(defaultWbsTreeSeparation).toEqual({
      siblings: 1.15,
      nonSiblings: 1.3,
    });
    expect(defaultWbsTreeZoom).toBe(1);
    expect(getWbsTreeNodeSize(196)).toEqual({
      x: 340,
      y: 308,
    });
  });

  it("wraps long labels into multiple lines without ellipsis", () => {
    expect(getWbsTextLineLimit(248)).toBeLessThanOrEqual(15);
    expect(splitWbsPreviewLines("프로젝트운영관리체계수립", 8)).toEqual([
      "프로젝트운영관리",
      "체계수립",
    ]);

    const wrapped = splitWbsPreviewLines(
      "상위 노드 텍스트가 카드 밖으로 넘치지 않도록 수정합니다",
      10,
    );

    expect(wrapped.length).toBeGreaterThan(2);
    expect(wrapped.join("")).toContain("수정합니다");
    expect(wrapped.some((line) => line.includes("…"))).toBe(false);
  });

  it("adds export bottom padding without moving the original tree origin", () => {
    const frame = getWbsTreeExportFrame(
      { left: 0, top: 0, width: 980, height: 620 },
      { left: 24, top: 24, width: 900, height: 520 },
      defaultWbsTreeExportPadding,
    );

    expect(frame.width).toBe(980);
    expect(frame.height).toBe(644);
    expect(frame.svgX).toBe(24);
    expect(frame.svgY).toBe(24);
    expect(frame.trailingPadding).toEqual({
      bottom: 24,
      right: 0,
    });
  });

  it("fits wide tree bounds into an export frame without clipping", () => {
    const frame = getWbsTreeContentExportFrame(
      { x: -620, y: 0, width: 1240, height: 520 },
      defaultWbsTreeExportPadding,
    );

    expect(frame.width).toBe(1364);
    expect(frame.height).toBe(596);
    expect(frame.transform).toEqual({
      scale: 1,
      x: 682,
      y: 26,
    });
    expect(frame.trailingPadding).toEqual({
      bottom: 50,
      right: 62,
    });
  });
});
