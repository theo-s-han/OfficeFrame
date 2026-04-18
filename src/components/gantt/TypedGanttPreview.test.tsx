import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TypedGanttPreview } from "./TypedGanttPreview";

vi.mock("./WbsTreePreview", () => ({
  WbsTreePreview: () => <div data-testid="wbs-tree-preview">WBS Tree Preview</div>,
}));

describe("TypedGanttPreview", () => {
  it("shows a single WBS preview output", () => {
    render(
      <TypedGanttPreview
        chartType="wbs"
        debugEnabled={false}
        onSelectTask={() => {}}
        selectedTaskId="wbs-1"
        tasks={[
          {
            id: "wbs-1",
            name: "요구 분석",
            parentId: "",
            start: "",
            end: "",
            progress: 0,
            status: "in-progress",
          },
        ]}
        wbsProjectName="오피스 툴 구축"
        wbsStructureType="deliverable"
      />,
    );

    expect(screen.getByTestId("wbs-tree-preview")).toBeInTheDocument();
    expect(screen.queryByText(/Mermaid/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/jsGantt/i)).not.toBeInTheDocument();
  });
});

