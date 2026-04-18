import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GanttEditorShell } from "@/components/gantt/GanttEditorShell";

describe("GanttEditorShell", () => {
  it("renders the updated gantt toolbar and core controls", () => {
    render(<GanttEditorShell />);

    expect(screen.getByText("기본 일정표 preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "작업 추가" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "이미지로 내보내기" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "오늘로 이동" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이미지 만들기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이미지 다운로드" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("배경 템플릿")).toHaveValue("clean");
    expect(
      screen.getByRole("button", { name: "요구사항 정리 색상 선택" }),
    ).toHaveTextContent(/#[0-9A-F]{6}/);
    expect(
      screen.getByDisplayValue("요구사항 정리").closest("[aria-selected]"),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("adds a task through the editor test entry point", () => {
    render(<GanttEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: "작업 추가" }));

    expect(screen.getByDisplayValue("새 작업")).toBeInTheDocument();
  });

  it("keeps task and timeline inputs as full dates across view modes", () => {
    render(<GanttEditorShell />);

    expect(screen.getByLabelText("요구사항 정리 시작")).toHaveValue("2026-04-17");
    expect(screen.getByLabelText("표시 시작")).toHaveValue("2026-04-13");
    expect(screen.getByLabelText("표시 종료")).toHaveValue("2026-08-15");

    fireEvent.click(screen.getByRole("button", { name: "월 단위" }));

    expect(screen.getByLabelText("요구사항 정리 시작")).toHaveValue("2026-04-17");
    expect(screen.getByLabelText("표시 시작")).toHaveValue("2026-04-13");
    expect(screen.getByLabelText("표시 종료")).toHaveValue("2026-08-15");

    fireEvent.click(screen.getByRole("button", { name: "분기 단위" }));

    expect(screen.getByLabelText("요구사항 정리 시작")).toHaveValue("2026-04-17");
    expect(screen.getByLabelText("표시 시작")).toHaveValue("2026-04-13");
    expect(screen.getByLabelText("표시 종료")).toHaveValue("2026-08-15");
  });

  it("updates end automatically when start moves past it", () => {
    render(<GanttEditorShell />);

    fireEvent.change(screen.getByLabelText("간트 MVP 구현 시작"), {
      target: { value: "2026-07-12" },
    });

    expect(screen.getByLabelText("간트 MVP 구현 시작")).toHaveValue("2026-07-12");
    expect(screen.getByLabelText("간트 MVP 구현 종료")).toHaveValue("2026-07-12");
  });

  it("expands the visible timeline when a task extends beyond the current range", () => {
    render(<GanttEditorShell />);

    fireEvent.change(screen.getByLabelText("문서용 출력 확인 종료"), {
      target: { value: "2026-08-31" },
    });

    expect(screen.getByLabelText("문서용 출력 확인 종료")).toHaveValue(
      "2026-08-31",
    );
    expect(screen.getByLabelText("표시 종료")).toHaveValue("2026-08-31");
  });

  it("blocks an end date earlier than start and shows a toast", () => {
    render(<GanttEditorShell />);

    fireEvent.change(screen.getByLabelText("화면 구조 검토 종료"), {
      target: { value: "2026-05-01" },
    });

    expect(screen.getByLabelText("화면 구조 검토 종료")).toHaveValue(
      "2026-06-29",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "종료일은 시작일보다 빠를 수 없습니다.",
    );
  });

  it("shows project timeline interval sliders for week and month modes", () => {
    render(<GanttEditorShell />);

    expect(screen.getByLabelText("주 간격 조절")).toHaveValue("40");
    fireEvent.change(screen.getByLabelText("주 간격 조절"), {
      target: { value: "65" },
    });
    expect(screen.getByLabelText("주 간격 조절")).toHaveValue("65");
    expect(screen.getByText("65px")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "월 단위" }));

    expect(screen.getByLabelText("월 간격 조절")).toHaveValue("40");
  });

  it("removes roadmap and progress tracking buttons", () => {
    render(<GanttEditorShell />);

    expect(
      screen.queryByRole("button", { name: /로드맵형/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /진행률 추적형/ }),
    ).not.toBeInTheDocument();
  });

  it("uses milestone-specific input fields and document preview", () => {
    render(<GanttEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: /마일스톤형/ }));

    expect(screen.getByText("마일스톤 preview")).toBeInTheDocument();
    expect(screen.getByLabelText("프로젝트 킥오프 id")).toHaveValue(
      "ms-kickoff",
    );
    expect(screen.getByLabelText("프로젝트 킥오프 날짜")).toHaveAttribute(
      "type",
      "date",
    );
    expect(screen.getByLabelText("프로젝트 킥오프 날짜")).toHaveValue(
      "2026-04-20",
    );
    expect(screen.getByLabelText("프로젝트 킥오프 section")).toHaveValue(
      "기획",
    );
    expect(screen.getByLabelText("프로젝트 킥오프 상태")).toHaveValue("done");
    expect(screen.getByLabelText("프로젝트 킥오프 critical")).not.toBeChecked();
    expect(
      screen.queryByRole("option", { name: "위험" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "차단" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Mermaid Gantt")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("프로젝트 킥오프 종료"),
    ).not.toBeInTheDocument();
  });

  it("uses WBS-specific hierarchy and node fields", () => {
    render(<GanttEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: /WBS\/단계형/ }));

    expect(screen.getByText("WBS preview")).toBeInTheDocument();
    expect(screen.getByDisplayValue("wbs-plan")).toBeInTheDocument();
    expect(screen.getByLabelText("기획 code")).toHaveValue("1");
    expect(screen.getByLabelText("기획 nodeType")).toHaveValue("group");
    expect(screen.getByLabelText("기획 open")).toBeChecked();
    expect(screen.getByLabelText("사용자 시나리오 정리 parentId")).toHaveValue(
      "wbs-plan",
    );
    expect(screen.getByLabelText("입력 스키마 정의 dependsOn")).toHaveValue(
      "wbs-scenario",
    );
    expect(screen.getByText("Mermaid TreeView")).toBeInTheDocument();
    expect(screen.getByText("Mermaid Mindmap")).toBeInTheDocument();
  });

  it("changes basic project styling controls", () => {
    render(<GanttEditorShell />);

    fireEvent.change(screen.getByLabelText("배경 템플릿"), {
      target: { value: "document" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "요구사항 정리 색상 선택" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Dusty Rose #A65D7B" }));
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(screen.getByLabelText("배경 템플릿")).toHaveValue("document");
    expect(
      screen.getByRole("button", { name: "요구사항 정리 색상 선택" }),
    ).toHaveTextContent("#A65D7B");
  });

  it("applies a custom HEX color through the basic project color dialog", () => {
    render(<GanttEditorShell />);

    fireEvent.click(
      screen.getByRole("button", { name: "요구사항 정리 색상 선택" }),
    );
    expect(
      screen.getByRole("dialog", { name: "요구사항 정리 색상 선택" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("HEX 색상 코드"), {
      target: { value: "#4F6FAA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(
      screen.getByRole("button", { name: "요구사항 정리 색상 선택" }),
    ).toHaveTextContent("#4F6FAA");
  });
});
