"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MindElixirCtor, MindElixirData, MindElixirInstance, NodeObj } from "mind-elixir";
import { buildMindElixirData, findMindmapNode, type MindmapNode } from "@/lib/mindmap/model";
import { recordMindmapDebugEvent } from "@/lib/mindmap/debug";
import { defaultMindmapTheme } from "@/lib/mindmap/theme";

type MindmapCanvasPreviewProps = {
  canRemoveSelectedNode: boolean;
  debugEnabled: boolean;
  fitViewToken: number;
  root: MindmapNode;
  selectedNodeId: string;
  onAddChildNode: (nodeId: string) => void;
  onOpenColorPicker: (nodeId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, nextTopic: string) => void;
  onSelectNode: (nodeId: string) => void;
};

type MindmapTopicElement = HTMLElement & {
  nodeObj?: {
    id?: string;
  };
};

function resolveTopicElement(target: EventTarget | null): MindmapTopicElement | null {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  if (target.tagName.toLowerCase() === "me-tpc") {
    return target as MindmapTopicElement;
  }

  const parent = target.closest("me-parent");

  if (!parent) {
    return null;
  }

  const directTopic = Array.from(parent.children).find(
    (child) => child.tagName.toLowerCase() === "me-tpc",
  );

  return (directTopic as MindmapTopicElement | undefined) ?? null;
}

export function MindmapCanvasPreview({
  canRemoveSelectedNode,
  debugEnabled,
  fitViewToken,
  root,
  selectedNodeId,
  onAddChildNode,
  onOpenColorPicker,
  onRemoveNode,
  onRenameNode,
  onSelectNode,
}: MindmapCanvasPreviewProps) {
  const previewData = useMemo<MindElixirData>(() => buildMindElixirData(root), [root]);
  const selectedNodeColor = useMemo(
    () => findMindmapNode(root, selectedNodeId)?.color ?? root.color,
    [root, selectedNodeId],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const inlineEditorRef = useRef<HTMLInputElement>(null);
  const activeInlineEditorNodeIdRef = useRef<string | null>(null);
  const instanceRef = useRef<MindElixirInstance | null>(null);
  const ctorRef = useRef<MindElixirCtor | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  const onAddChildNodeRef = useRef(onAddChildNode);
  const onOpenColorPickerRef = useRef(onOpenColorPicker);
  const onRemoveNodeRef = useRef(onRemoveNode);
  const onRenameNodeRef = useRef(onRenameNode);
  const previewDataRef = useRef(previewData);
  const [renderError, setRenderError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [controlsPosition, setControlsPosition] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [editingNode, setEditingNode] = useState<{
    height: number;
    left: number;
    nodeId: string;
    top: number;
    value: string;
    width: number;
  } | null>(null);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
    onAddChildNodeRef.current = onAddChildNode;
    onOpenColorPickerRef.current = onOpenColorPicker;
    onRemoveNodeRef.current = onRemoveNode;
    onRenameNodeRef.current = onRenameNode;
    previewDataRef.current = previewData;
  }, [onAddChildNode, onOpenColorPicker, onRemoveNode, onRenameNode, onSelectNode, previewData]);

  useEffect(() => {
    if (!editingNode) {
      activeInlineEditorNodeIdRef.current = null;
      return;
    }

    if (activeInlineEditorNodeIdRef.current === editingNode.nodeId) {
      return;
    }

    activeInlineEditorNodeIdRef.current = editingNode.nodeId;
    inlineEditorRef.current?.focus();
    inlineEditorRef.current?.select();
  }, [editingNode]);

  const updateEditingPosition = useCallback((nodeId: string) => {
    const MindElixir = ctorRef.current;
    const instance = instanceRef.current;
    const previewFrame = previewFrameRef.current;

    if (!MindElixir || !instance || !previewFrame) {
      return null;
    }

    const nodeElement = MindElixir.E(nodeId, instance.map);

    if (!nodeElement) {
      return null;
    }

    const nodeRect = nodeElement.getBoundingClientRect();
    const frameRect = previewFrame.getBoundingClientRect();

    return {
      height: Math.max(40, Math.ceil(nodeRect.height)),
      left: nodeRect.left - frameRect.left - 4,
      top: nodeRect.top - frameRect.top - 4,
      width: Math.max(160, Math.ceil(nodeRect.width) + 8),
    };
  }, []);

  const startInlineEdit = useCallback(
    (nodeId: string, value: string) => {
      const nextPosition = updateEditingPosition(nodeId);

      if (!nextPosition) {
        return;
      }

      setEditingNode({
        nodeId,
        value,
        ...nextPosition,
      });
      recordMindmapDebugEvent("preview.edit.start", { nodeId }, debugEnabled);
    },
    [debugEnabled, updateEditingPosition],
  );

  const cancelInlineEdit = useCallback(() => {
    if (!editingNode) {
      return;
    }

    recordMindmapDebugEvent("preview.edit.cancel", { nodeId: editingNode.nodeId }, debugEnabled);
    setEditingNode(null);
  }, [debugEnabled, editingNode]);

  const commitInlineEdit = useCallback(() => {
    if (!editingNode) {
      return;
    }

    const nextTopic = editingNode.value.trim();
    const previousTopic = findMindmapNode(root, editingNode.nodeId)?.topic.trim() ?? "";

    setEditingNode(null);

    if (!nextTopic || nextTopic === previousTopic) {
      return;
    }

    onRenameNodeRef.current(editingNode.nodeId, nextTopic);
    recordMindmapDebugEvent(
      "preview.edit.commit",
      { nodeId: editingNode.nodeId, nextTopic },
      debugEnabled,
    );
  }, [debugEnabled, editingNode, root]);

  useEffect(() => {
    let mounted = true;
    let removeSelectionListener: (() => void) | undefined;
    let removeDomSelectionListener: (() => void) | undefined;
    let removeDomEditListener: (() => void) | undefined;

    async function mountPreview() {
      if (!containerRef.current) {
        return;
      }

      const { default: MindElixir } = await import("mind-elixir");

      if (!mounted || !containerRef.current) {
        return;
      }

      ctorRef.current = MindElixir;
      const instance = new MindElixir({
        el: containerRef.current,
        direction: MindElixir.SIDE,
        editable: false,
        allowUndo: false,
        contextMenu: false,
        toolBar: false,
        keypress: false,
        overflowHidden: false,
        handleWheel: true,
        theme: defaultMindmapTheme,
        scaleMin: 0.5,
        scaleMax: 2.2,
      });

      instance.init(previewDataRef.current);
      instance.clearHistory?.();
      instanceRef.current = instance;

      const handleSelectNodes = (nodes: NodeObj[]) => {
        const nextNodeId = nodes[0]?.id;

        if (!nextNodeId) {
          return;
        }

        onSelectNodeRef.current(nextNodeId);
        recordMindmapDebugEvent("preview.select", { nodeId: nextNodeId }, debugEnabled);
      };

      instance.bus.addListener("selectNodes", handleSelectNodes);
      removeSelectionListener = () =>
        instance.bus.removeListener("selectNodes", handleSelectNodes);

      const handleTopicClick = (event: MouseEvent) => {
        const topicElement = resolveTopicElement(event.target);
        const nextNodeId = topicElement?.nodeObj?.id;

        if (!topicElement || !nextNodeId) {
          return;
        }

        instance.selectNode(topicElement as never);
        onSelectNodeRef.current(nextNodeId);
        recordMindmapDebugEvent("preview.select.dom", { nodeId: nextNodeId }, debugEnabled);
      };

      const handleTopicDoubleClick = (event: MouseEvent) => {
        const topicElement = resolveTopicElement(event.target);
        const nextNodeId = topicElement?.nodeObj?.id;

        if (!topicElement || !nextNodeId) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onSelectNodeRef.current(nextNodeId);
        startInlineEdit(nextNodeId, topicElement.textContent?.trim() ?? "");
      };

      containerRef.current.addEventListener("click", handleTopicClick, true);
      containerRef.current.addEventListener("dblclick", handleTopicDoubleClick, true);
      removeDomSelectionListener = () =>
        containerRef.current?.removeEventListener("click", handleTopicClick, true);
      removeDomEditListener = () =>
        containerRef.current?.removeEventListener("dblclick", handleTopicDoubleClick, true);

      recordMindmapDebugEvent(
        "preview.init",
        {
          rootId: previewDataRef.current.nodeData.id,
          nodeCount: previewDataRef.current.nodeData.children?.length ?? 0,
        },
        debugEnabled,
      );

      setRenderError("");
      setIsReady(true);

      window.requestAnimationFrame(() => {
        instance.scaleFit();
        instance.toCenter();
      });
    }

    mountPreview().catch((error) => {
      setRenderError("마인드맵 미리보기를 준비하지 못했습니다.");
      recordMindmapDebugEvent(
        "preview.error",
        {
          message: error instanceof Error ? error.message : "unknown mindmap error",
        },
        debugEnabled,
      );
    });

    return () => {
      mounted = false;
      removeSelectionListener?.();
      removeDomSelectionListener?.();
      removeDomEditListener?.();
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [debugEnabled, startInlineEdit]);

  useEffect(() => {
    const instance = instanceRef.current;

    if (!instance) {
      return;
    }

    instance.refresh(previewData);
    instance.clearHistory?.();
    recordMindmapDebugEvent("preview.refresh", { rootId: root.id }, debugEnabled);
  }, [debugEnabled, previewData, root.id]);

  useEffect(() => {
    const instance = instanceRef.current;
    const MindElixir = ctorRef.current;

    if (!instance || !MindElixir || !selectedNodeId) {
      return;
    }

    window.requestAnimationFrame(() => {
      const nodeElement = MindElixir.E(selectedNodeId, instance.map);

      if (!nodeElement) {
        return;
      }

      instance.selectNode(nodeElement);
      instance.scrollIntoView(nodeElement);
    });
  }, [selectedNodeId, previewData]);

  useEffect(() => {
    const instance = instanceRef.current;

    if (!instance) {
      return;
    }

    window.requestAnimationFrame(() => {
      instance.scaleFit();
      instance.toCenter();
      recordMindmapDebugEvent("preview.fit", { fitViewToken }, debugEnabled);
    });
  }, [debugEnabled, fitViewToken]);

  useEffect(() => {
    if (!editingNode?.nodeId) {
      return;
    }

    const renderTarget = containerRef.current;
    const mapContainer = renderTarget?.querySelector<HTMLElement>(".map-container");

    const refreshEditorPosition = () => {
      const nextPosition = updateEditingPosition(editingNode.nodeId);

      if (!nextPosition) {
        setEditingNode(null);
        return;
      }

      setEditingNode((current) =>
        current && current.nodeId === editingNode.nodeId
          ? current.left !== nextPosition.left ||
            current.top !== nextPosition.top ||
            current.width !== nextPosition.width ||
            current.height !== nextPosition.height
            ? {
                ...current,
                ...nextPosition,
              }
            : current
          : current,
      );
    };

    const rafId = window.requestAnimationFrame(refreshEditorPosition);
    mapContainer?.addEventListener("scroll", refreshEditorPosition, { passive: true });
    window.addEventListener("resize", refreshEditorPosition);

    return () => {
      window.cancelAnimationFrame(rafId);
      mapContainer?.removeEventListener("scroll", refreshEditorPosition);
      window.removeEventListener("resize", refreshEditorPosition);
    };
  }, [editingNode?.nodeId, fitViewToken, previewData, updateEditingPosition]);

  useEffect(() => {
    const instance = instanceRef.current;
    const MindElixir = ctorRef.current;
    const previewFrame = previewFrameRef.current;
    const renderTarget = containerRef.current;

    if (!instance || !MindElixir || !previewFrame || !renderTarget || !selectedNodeId) {
      setControlsPosition(null);
      return;
    }

    const mapContainer = renderTarget.querySelector<HTMLElement>(".map-container");

    const updateControlsPosition = () => {
      const nodeElement = MindElixir.E(selectedNodeId, instance.map);

      if (!nodeElement) {
        setControlsPosition(null);
        return;
      }

      const nodeRect = nodeElement.getBoundingClientRect();
      const frameRect = previewFrame.getBoundingClientRect();
      const nextLeft = Math.min(
        Math.max(52, nodeRect.left + nodeRect.width / 2 - frameRect.left),
        Math.max(52, frameRect.width - 52),
      );
      const nextTop = Math.min(
        Math.max(54, nodeRect.top - frameRect.top - 10),
        Math.max(54, frameRect.height - 16),
      );

      setControlsPosition({
        left: nextLeft,
        top: nextTop,
      });
    };

    const rafId = window.requestAnimationFrame(updateControlsPosition);

    mapContainer?.addEventListener("scroll", updateControlsPosition, { passive: true });
    window.addEventListener("resize", updateControlsPosition);

    return () => {
      window.cancelAnimationFrame(rafId);
      mapContainer?.removeEventListener("scroll", updateControlsPosition);
      window.removeEventListener("resize", updateControlsPosition);
    };
  }, [fitViewToken, isReady, previewData, selectedNodeId]);

  if (renderError) {
    return (
      <div className="mindmap-preview-placeholder" role="alert">
        {renderError}
      </div>
    );
  }

  return (
    <div className="mindmap-preview-canvas" ref={previewFrameRef}>
      <div className="mindmap-render-target" data-ready={isReady} ref={containerRef} />
      {controlsPosition && !editingNode ? (
        <div
          className="mindmap-node-floating-actions"
          data-export-ignore="true"
          style={{
            left: `${controlsPosition.left}px`,
            top: `${controlsPosition.top}px`,
          }}
        >
          <button
            aria-label="선택 노드 하위 추가"
            type="button"
            onClick={() => onAddChildNodeRef.current(selectedNodeId)}
          >
            +
          </button>
          <button
            aria-label="선택 노드 색상 선택"
            className="mindmap-node-color-button"
            type="button"
            onClick={() => onOpenColorPickerRef.current(selectedNodeId)}
          >
            <span
              aria-hidden="true"
              className="mindmap-node-color-chip"
              style={{ backgroundColor: selectedNodeColor }}
            />
          </button>
          <button
            aria-label="선택 노드 삭제"
            disabled={!canRemoveSelectedNode}
            type="button"
            onClick={() => onRemoveNodeRef.current(selectedNodeId)}
          >
            -
          </button>
        </div>
      ) : null}
      {editingNode ? (
        <input
          aria-label="선택 노드 이름 편집"
          className="mindmap-inline-editor"
          ref={inlineEditorRef}
          style={{
            left: `${editingNode.left}px`,
            top: `${editingNode.top}px`,
            width: `${editingNode.width}px`,
            minHeight: `${editingNode.height}px`,
          }}
          value={editingNode.value}
          onBlur={commitInlineEdit}
          onChange={(event) =>
            setEditingNode((current) =>
              current
                ? {
                    ...current,
                    value: event.target.value,
                  }
                : current,
            )
          }
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitInlineEdit();
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              cancelInlineEdit();
            }
          }}
        />
      ) : null}
    </div>
  );
}
