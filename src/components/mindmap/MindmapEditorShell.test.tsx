import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MindmapEditorShell } from "./MindmapEditorShell";

const selectNodeMock = vi.fn();
const clearHistoryMock = vi.fn();
const scaleFitMock = vi.fn();
const toCenterMock = vi.fn();
const scrollIntoViewMock = vi.fn();
const addListenerMock = vi.fn();
const removeListenerMock = vi.fn();
const destroyMock = vi.fn();
const exportMock = vi.fn().mockResolvedValue("data:image/png;base64,mindmap");
const topicRegistry = new Map<string, HTMLElement>();

function createTopicRect(): DOMRect {
  return {
    x: 100,
    y: 100,
    left: 100,
    top: 100,
    right: 220,
    bottom: 140,
    width: 120,
    height: 40,
    toJSON: () => "",
  } as DOMRect;
}

function renderMindmapPreview(
  data: { nodeData: { id: string; topic: string; children?: unknown[] } },
  host: HTMLElement,
) {
  topicRegistry.clear();
  host.innerHTML = "";

  const mapContainer = document.createElement("div");
  mapContainer.className = "map-container";
  mapContainer.getBoundingClientRect = createTopicRect;

  const mapCanvas = document.createElement("div");
  mapCanvas.className = "map-canvas";
  mapCanvas.getBoundingClientRect = createTopicRect;
  mapContainer.appendChild(mapCanvas);
  host.appendChild(mapContainer);

  const visit = (node: { id: string; topic: string; children?: unknown[] }) => {
    const parent = document.createElement("me-parent");
    const topic = document.createElement("me-tpc") as HTMLElement & {
      nodeObj?: { id?: string };
    };

    topic.nodeObj = { id: node.id };
    topic.textContent = node.topic;
    topic.getBoundingClientRect = createTopicRect;
    parent.appendChild(topic);
    mapCanvas.appendChild(parent);
    topicRegistry.set(node.id, topic);

    (node.children as { id: string; topic: string; children?: unknown[] }[] | undefined)?.forEach(
      visit,
    );
  };

  visit(data.nodeData);
}

function getPreviewNodes(container: HTMLElement) {
  return Array.from(container.querySelectorAll("me-tpc")) as HTMLElement[];
}

function getActionBarButtons(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".action-bar button")) as HTMLButtonElement[];
}

function getFloatingButtons(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll(".mindmap-node-floating-actions button"),
  ) as HTMLButtonElement[];
}

const eMock = vi.fn((id: string) => topicRegistry.get(id) ?? null);

vi.mock("mind-elixir", () => {
  class MindElixirMock {
    static SIDE = 2;
    static E = eMock;
    el: HTMLElement;
    map = document.createElement("div");
    bus = {
      addListener: addListenerMock,
      removeListener: removeListenerMock,
    };

    constructor(options: { el: HTMLElement }) {
      this.el = options.el;
    }

    init = vi.fn((data) => {
      renderMindmapPreview(data, this.el);
      this.map = this.el.querySelector(".map-canvas") as HTMLDivElement;
    });

    refresh = vi.fn((data) => {
      renderMindmapPreview(data, this.el);
      this.map = this.el.querySelector(".map-canvas") as HTMLDivElement;
    });

    clearHistory = clearHistoryMock;
    exportPng = vi.fn().mockResolvedValue(new Blob(["mindmap"], { type: "image/png" }));
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
  topicRegistry.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("MindmapEditorShell", () => {
  it("renders the editor and leaves undo disabled initially", async () => {
    const { container } = render(<MindmapEditorShell />);

    expect(container.querySelector(".mindmap-editor-shell")).toBeInTheDocument();
    expect(container.querySelector(".mindmap-preview-surface")).toBeInTheDocument();
    expect(container.querySelectorAll(".mindmap-outline-row").length).toBeGreaterThan(1);

    await waitFor(() => {
      expect(container.querySelector(".mindmap-node-floating-actions")).toBeTruthy();
    });

    expect(getActionBarButtons(container)[2]).toBeDisabled();
  });

  it("adds and removes a child directly from preview controls", async () => {
    const { container } = render(<MindmapEditorShell />);
    const initialRows = container.querySelectorAll(".mindmap-outline-row").length;

    await waitFor(() => {
      expect(getFloatingButtons(container).length).toBe(3);
    });

    fireEvent.click(getFloatingButtons(container)[0]);

    expect(container.querySelectorAll(".mindmap-outline-row")).toHaveLength(initialRows + 1);
    expect(getActionBarButtons(container)[2]).toBeEnabled();

    fireEvent.click(getFloatingButtons(container)[2]);

    expect(container.querySelectorAll(".mindmap-outline-row")).toHaveLength(initialRows);
  });

  it("selects a clicked preview node and removes that subtree", async () => {
    const { container } = render(<MindmapEditorShell />);

    await waitFor(() => {
      expect(getPreviewNodes(container).length).toBeGreaterThan(1);
    });

    const previewNode = getPreviewNodes(container)[1];
    const previewLabel = previewNode.textContent?.trim();

    expect(previewLabel).toBeTruthy();

    if (!previewLabel) {
      throw new Error("preview node label not found");
    }

    fireEvent.click(previewNode);

    await waitFor(() => {
      expect(container.querySelector(".mindmap-node-editor input")).toHaveValue(previewLabel);
    });

    await waitFor(() => {
      expect(getFloatingButtons(container).length).toBe(3);
    });

    fireEvent.click(getFloatingButtons(container)[2]);

    await waitFor(() => {
      expect(getPreviewNodes(container).some((node) => node.textContent?.trim() === previewLabel)).toBe(
        false,
      );
    });
  });

  it("renames a preview node by double clicking and typing", async () => {
    const { container } = render(<MindmapEditorShell />);

    await waitFor(() => {
      expect(getPreviewNodes(container).length).toBeGreaterThan(1);
    });

    const previewNode = getPreviewNodes(container)[1];

    fireEvent.doubleClick(previewNode);

    const inlineEditor = await waitFor(() => {
      const editor = container.querySelector<HTMLInputElement>(".mindmap-inline-editor");

      expect(editor).toBeTruthy();

      return editor as HTMLInputElement;
    });

    fireEvent.change(inlineEditor, { target: { value: "Renamed Node" } });
    fireEvent.keyDown(inlineEditor, { key: "Enter" });

    await waitFor(() => {
      expect(container.querySelector(".mindmap-node-editor input")).toHaveValue("Renamed Node");
      expect(
        getPreviewNodes(container).some((node) => node.textContent?.trim() === "Renamed Node"),
      ).toBe(true);
    });
  });

  it("keeps the full inline edit value while typing multiple characters", async () => {
    const selectSpy = vi.spyOn(HTMLInputElement.prototype, "select");
    const { container } = render(<MindmapEditorShell />);

    await waitFor(() => {
      expect(getPreviewNodes(container).length).toBeGreaterThan(1);
    });

    fireEvent.doubleClick(getPreviewNodes(container)[1]);

    const inlineEditor = await waitFor(() => {
      const editor = container.querySelector<HTMLInputElement>(".mindmap-inline-editor");

      expect(editor).toBeTruthy();

      return editor as HTMLInputElement;
    });

    await waitFor(() => {
      expect(selectSpy).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(inlineEditor, { target: { value: "A" } });
    fireEvent.change(inlineEditor, { target: { value: "Alpha" } });
    fireEvent.change(inlineEditor, { target: { value: "Alpha Beta" } });

    expect(inlineEditor).toHaveValue("Alpha Beta");
    expect(selectSpy).toHaveBeenCalledTimes(1);
  });

  it("undoes the last preview edit", async () => {
    const { container } = render(<MindmapEditorShell />);
    const initialRows = container.querySelectorAll(".mindmap-outline-row").length;

    await waitFor(() => {
      expect(getFloatingButtons(container).length).toBe(3);
    });

    fireEvent.click(getFloatingButtons(container)[0]);

    expect(container.querySelectorAll(".mindmap-outline-row")).toHaveLength(initialRows + 1);

    fireEvent.click(getActionBarButtons(container)[2]);

    expect(container.querySelectorAll(".mindmap-outline-row")).toHaveLength(initialRows);
  });

  it("opens the color picker from preview controls and applies the chosen color", async () => {
    const { container } = render(<MindmapEditorShell />);

    await waitFor(() => {
      expect(getPreviewNodes(container).length).toBeGreaterThan(1);
      expect(getFloatingButtons(container).length).toBe(3);
    });

    fireEvent.click(getPreviewNodes(container)[1]);
    fireEvent.click(getFloatingButtons(container)[1]);

    const dialog = await waitFor(() => {
      const nextDialog = document.querySelector<HTMLElement>(".color-picker-dialog");

      expect(nextDialog).toBeTruthy();

      return nextDialog as HTMLElement;
    });

    const hexInput = dialog.querySelector<HTMLInputElement>('input[placeholder="#5B6EE1"]');
    const applyButton = dialog.querySelector<HTMLButtonElement>("button.primary-action");

    expect(hexInput).toBeTruthy();
    expect(applyButton).toBeTruthy();

    if (!hexInput || !applyButton) {
      throw new Error("color picker controls not found");
    }

    fireEvent.change(hexInput, { target: { value: "#A65D7B" } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(document.querySelector(".color-picker-dialog")).toBeNull();
      expect(container.querySelector(".mindmap-node-editor .color-picker-trigger")).toHaveTextContent(
        "#A65D7B",
      );
    });
  });

  it("exports the current preview as an image", async () => {
    const { container } = render(<MindmapEditorShell />);

    await waitFor(() => {
      expect(getActionBarButtons(container)[3]).toBeEnabled();
    });

    fireEvent.click(getActionBarButtons(container)[3]);

    await waitFor(() => {
      expect(exportMock).toHaveBeenCalled();
      expect(container.querySelector(".export-status")).toBeTruthy();
    });
  });
});
