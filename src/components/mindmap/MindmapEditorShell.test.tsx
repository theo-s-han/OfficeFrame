import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MindmapEditorShell } from "./MindmapEditorShell";

const selectNodeMock = vi.fn();
const refreshMock = vi.fn();
const clearHistoryMock = vi.fn();
const scaleFitMock = vi.fn();
const toCenterMock = vi.fn();
const scrollIntoViewMock = vi.fn();
const addListenerMock = vi.fn();
const removeListenerMock = vi.fn();
const destroyMock = vi.fn();
const eMock = vi.fn(() => document.createElement("div"));
const exportMock = vi.fn().mockResolvedValue("data:image/png;base64,mindmap");

vi.mock("mind-elixir", () => {
  class MindElixirMock {
    static SIDE = 2;
    static E = eMock;
    map = document.createElement("div");
    bus = {
      addListener: addListenerMock,
      removeListener: removeListenerMock,
    };
    init = vi.fn();
    refresh = refreshMock;
    clearHistory = clearHistoryMock;
    scaleFit = scaleFitMock;
    toCenter = toCenterMock;
    selectNode = selectNodeMock;
    scrollIntoView = scrollIntoViewMock;
    destroy = destroyMock;
  }

  return {
    default: MindElixirMock,
  };
});

vi.mock("@/lib/mindmap/export", () => ({
  exportMindmapPreviewImage: (...args: unknown[]) => exportMock(...args),
}));

beforeEach(() => {
  HTMLElement.prototype.click = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("MindmapEditorShell", () => {
  it("renders the editor shell with preview and outline", () => {
    render(<MindmapEditorShell />);

    expect(screen.getByRole("heading", { name: "마인드맵 입력" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "마인드맵 preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "하위 노드 추가" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "이미지로 내보내기" })).toBeEnabled();
    expect(screen.getByText("문서형 업무 도구")).toBeInTheDocument();
  });

  it("adds and removes nodes from the outline", () => {
    render(<MindmapEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: "하위 노드 추가" }));

    expect(screen.getAllByDisplayValue("새 노드")[0]).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "노드 삭제" }));

    expect(screen.queryAllByDisplayValue("새 노드")).toHaveLength(0);
  });

  it("updates selected node content and color", () => {
    render(<MindmapEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: /문서형 업무 도구 색상 선택/ }));
    fireEvent.click(screen.getByRole("button", { name: "Dusty Rose #A65D7B" }));
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(
      screen.getByRole("button", { name: /문서형 업무 도구 색상 선택/ }),
    ).toHaveTextContent("#A65D7B");

    fireEvent.change(screen.getByLabelText("문서형 업무 도구 이름"), {
      target: { value: "업무 구조 맵" },
    });

    expect(screen.getByDisplayValue("업무 구조 맵")).toBeInTheDocument();
  });

  it("exports the current preview as an image", async () => {
    render(<MindmapEditorShell />);

    fireEvent.click(screen.getByRole("button", { name: "이미지로 내보내기" }));

    expect(exportMock).toHaveBeenCalled();
  });
});
