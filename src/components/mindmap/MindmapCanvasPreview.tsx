"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MindElixirCtor,
  MindElixirData,
  MindElixirInstance,
  NodeObj,
} from "mind-elixir";
import {
  buildMindElixirData,
  type MindmapNode,
} from "@/lib/mindmap/model";
import { defaultMindmapTheme } from "@/lib/mindmap/theme";
import { recordMindmapDebugEvent } from "@/lib/mindmap/debug";

type MindmapCanvasPreviewProps = {
  debugEnabled: boolean;
  fitViewToken: number;
  root: MindmapNode;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
};

export function MindmapCanvasPreview({
  debugEnabled,
  fitViewToken,
  root,
  selectedNodeId,
  onSelectNode,
}: MindmapCanvasPreviewProps) {
  const previewData = useMemo<MindElixirData>(
    () => buildMindElixirData(root),
    [root],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MindElixirInstance | null>(null);
  const ctorRef = useRef<MindElixirCtor | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  const previewDataRef = useRef(previewData);
  const [renderError, setRenderError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
    previewDataRef.current = previewData;
  }, [onSelectNode, previewData]);

  useEffect(() => {
    let mounted = true;
    let removeSelectionListener: (() => void) | undefined;

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
        recordMindmapDebugEvent(
          "preview.select",
          { nodeId: nextNodeId },
          debugEnabled,
        );
      };

      instance.bus.addListener("selectNodes", handleSelectNodes);
      removeSelectionListener = () =>
        instance.bus.removeListener("selectNodes", handleSelectNodes);
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
          message:
            error instanceof Error ? error.message : "unknown mindmap error",
        },
        debugEnabled,
      );
    });

    return () => {
      mounted = false;
      removeSelectionListener?.();
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [debugEnabled]);

  useEffect(() => {
    const instance = instanceRef.current;

    if (!instance) {
      return;
    }

    instance.refresh(previewData);
    instance.clearHistory?.();
    recordMindmapDebugEvent(
      "preview.refresh",
      { rootId: root.id },
      debugEnabled,
    );
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

  if (renderError) {
    return (
      <div className="mindmap-preview-placeholder" role="alert">
        {renderError}
      </div>
    );
  }

  return (
    <div className="mindmap-render-target" data-ready={isReady} ref={containerRef} />
  );
}
