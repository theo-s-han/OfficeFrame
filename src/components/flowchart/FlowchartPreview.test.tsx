import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSampleFlowchartDocument, getFlowchartConnections } from "@/lib/flowchart/model";
import { FlowchartPreview } from "./FlowchartPreview";

describe("FlowchartPreview", () => {
  it("renders step details and input/output summaries in the preview", () => {
    const document = createSampleFlowchartDocument();
    const { container } = render(
      <FlowchartPreview document={document} onSelectStep={vi.fn()} />,
    );
    const edgeLayer = container.querySelector<SVGElement>(".flowchart-static-edge-layer");

    expect(screen.getByText("요청서 -> 검토 대상 등록")).toBeInTheDocument();
    expect(
      screen.getByText("판단 기준: 재사용 가능 여부를 판단합니다."),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".flowchart-static-edge-path")).toHaveLength(
      getFlowchartConnections(document).length,
    );
    expect(edgeLayer?.getAttribute("preserveAspectRatio")).toBe("xMinYMin meet");
    expect(Number(edgeLayer?.getAttribute("width"))).toBeGreaterThan(0);
    expect(Number(edgeLayer?.getAttribute("height"))).toBeGreaterThan(0);
  });

  it("maps node clicks back to the selected step", () => {
    const document = createSampleFlowchartDocument();
    const onSelectStep = vi.fn();

    render(<FlowchartPreview document={document} onSelectStep={onSelectStep} />);
    fireEvent.click(screen.getByRole("button", { name: /요청 접수/i }));

    expect(onSelectStep).toHaveBeenCalledWith("flow-step-1");
  });
});
