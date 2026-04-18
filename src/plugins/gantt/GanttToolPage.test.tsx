import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GanttEditorShell } from "@/components/gantt/GanttEditorShell";

describe("GanttEditorShell", () => {
  it("renders the editable gantt MVP controls", () => {
    render(<GanttEditorShell />);

    expect(screen.getByText("기본 일정표 preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "작업 추가" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "PNG 다운로드" })).toBeEnabled();
    expect(screen.getByLabelText("배경 템플릿")).toHaveValue("clean");
    expect(screen.getByLabelText("요구사항 정리 색상")).toHaveValue("emerald");
    expect(
      screen.getByDisplayValue("요구사항 정리").closest("[aria-selected]"),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("adds a task through the editor test entry point", () => {
    render(<GanttEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: "작업 추가" }));

    expect(screen.getByDisplayValue("새 작업")).toBeInTheDocument();
  });

  it("changes task date inputs by selected date unit", () => {
    render(<GanttEditorShell />);

    expect(screen.getByLabelText("요구사항 정리 시작")).toHaveValue("2026-W17");

    fireEvent.click(screen.getByRole("button", { name: "월 단위" }));

    expect(screen.getByLabelText("요구사항 정리 시작")).toHaveValue("2026-04");
    expect(screen.getByLabelText("표시 시작")).toHaveValue("2026-04");

    fireEvent.click(screen.getByRole("button", { name: "분기 단위" }));

    expect(screen.getByLabelText("요구사항 정리 시작")).toHaveValue("2026-Q2");
    expect(screen.getByLabelText("표시 종료")).toHaveValue("2026-Q2");
  });

  it("switches inputs and preview copy by gantt chart type", () => {
    render(<GanttEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: /마일스톤형/ }));

    expect(screen.getByText("마일스톤형 preview")).toBeInTheDocument();
    expect(screen.getByDisplayValue("범위 승인")).toBeInTheDocument();
    expect(screen.getByLabelText("범위 승인 담당자")).toHaveValue("PM");
    expect(screen.getByLabelText("범위 승인 상태")).toHaveValue("done");
    expect(screen.queryByLabelText("범위 승인 종료")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/진행률/)).not.toBeInTheDocument();
  });

  it("uses chart-type specific input fields", () => {
    render(<GanttEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: /로드맵형/ }));

    expect(screen.getByLabelText("핵심 입력 흐름 영역")).toHaveValue("Editor");
    expect(screen.getByLabelText("핵심 입력 흐름 담당자")).toHaveValue(
      "Product",
    );
    expect(screen.getByLabelText("핵심 입력 흐름 상태")).toHaveValue(
      "on-track",
    );

    fireEvent.click(screen.getByRole("button", { name: /진행률 추적형/ }));

    expect(screen.getByLabelText("기획 확정 계획 시작")).toHaveValue(
      "2026-W16",
    );
    expect(screen.getByLabelText("기획 확정 계획 종료")).toHaveValue(
      "2026-W17",
    );

    fireEvent.click(screen.getByRole("button", { name: /WBS\/단계형/ }));

    expect(screen.getByLabelText("타입별 preview 구현 선행 작업")).toHaveValue(
      "wbs-2",
    );
  });

  it("changes basic project styling controls", () => {
    render(<GanttEditorShell />);

    fireEvent.change(screen.getByLabelText("배경 템플릿"), {
      target: { value: "document" },
    });
    fireEvent.change(screen.getByLabelText("요구사항 정리 색상"), {
      target: { value: "coral" },
    });

    expect(screen.getByLabelText("배경 템플릿")).toHaveValue("document");
    expect(screen.getByLabelText("요구사항 정리 색상")).toHaveValue("coral");
  });
});
