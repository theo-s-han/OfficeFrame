"use client";

import { useMemo, useRef, useState } from "react";
import { ColorPickerDialog } from "@/components/shared/ColorPickerDialog";
import {
  defaultGanttTaskColor,
  ganttTaskColorOptions,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";
import { readMindmapDebugEnabled, recordMindmapDebugEvent } from "@/lib/mindmap/debug";
import {
  exportMindmapPreviewImage,
  type MindmapPreviewExportHandle,
} from "@/lib/mindmap/export";
import {
  cloneMindmapNode,
  countMindmapNodes,
  createEmptyMindmap,
  createMindmapNode,
  createSampleMindmap,
  findMindmapNode,
  flattenMindmap,
  getMindmapDepth,
  getNextMindmapId,
  getSuggestedMindmapColor,
  insertMindmapChild,
  insertMindmapSibling,
  removeMindmapNode,
  updateMindmapNode,
  validateMindmap,
  type MindmapNode,
} from "@/lib/mindmap/model";
import { createDatedPngFileName, downloadDataUrl } from "@/lib/shared/download";
import { MindmapCanvasPreview } from "./MindmapCanvasPreview";

const initialMindmap = createSampleMindmap();
const maxMindmapHistoryEntries = 50;

type MindmapHistoryEntry = {
  root: MindmapNode;
  selectedNodeId: string;
};

function createHistoryEntry(root: MindmapNode, selectedNodeId: string): MindmapHistoryEntry {
  return {
    root: cloneMindmapNode(root),
    selectedNodeId,
  };
}

export function MindmapEditorShell() {
  const [root, setRoot] = useState(initialMindmap);
  const [selectedNodeId, setSelectedNodeId] = useState(initialMindmap.id);
  const [history, setHistory] = useState<MindmapHistoryEntry[]>([]);
  const [exportStatus, setExportStatus] = useState("");
  const [fitViewToken, setFitViewToken] = useState(0);
  const [colorDialogNodeId, setColorDialogNodeId] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState(defaultGanttTaskColor);
  const [isPreviewExportReady, setIsPreviewExportReady] = useState(false);
  const debugEnabled = useState(() => readMindmapDebugEnabled())[0];
  const exportHandleRef = useRef<MindmapPreviewExportHandle | null>(null);

  const flatNodes = useMemo(() => flattenMindmap(root), [root]);
  const selectedNode = findMindmapNode(root, selectedNodeId) ?? root;
  const selectedFlatNode = flatNodes.find((node) => node.id === selectedNode.id);
  const issues = useMemo(() => validateMindmap(root), [root]);
  const selectedNodeIssues = issues.filter((issue) => issue.nodeId === selectedNode.id);
  const canExport = issues.length === 0 && isPreviewExportReady;
  const canDeleteSelectedNode = selectedNode.id !== root.id;
  const canUndo = history.length > 0;
  const previewStats = useMemo(
    () => ({
      nodeCount: countMindmapNodes(root),
      depth: getMindmapDepth(root),
    }),
    [root],
  );
  const colorDialogNode = colorDialogNodeId ? findMindmapNode(root, colorDialogNodeId) : undefined;
  const previewDraftColor = normalizeGanttTaskColor(draftColor);
  const canApplyDraftColor = isValidGanttTaskColor(previewDraftColor);

  function pushHistoryEntry(entry: MindmapHistoryEntry) {
    setHistory((currentHistory) => [
      ...currentHistory.slice(-(maxMindmapHistoryEntries - 1)),
      entry,
    ]);
  }

  function applyMindmapChange(
    nextRoot: MindmapNode,
    options?: {
      debugEvent?: string;
      debugPayload?: Record<string, unknown>;
      fitView?: boolean;
      nextSelectedNodeId?: string;
    },
  ) {
    pushHistoryEntry(createHistoryEntry(root, selectedNode.id));

    const requestedSelectedNodeId = options?.nextSelectedNodeId ?? selectedNode.id;
    const nextSelectedNodeId = findMindmapNode(nextRoot, requestedSelectedNodeId)
      ? requestedSelectedNodeId
      : nextRoot.id;

    setRoot(nextRoot);
    setSelectedNodeId(nextSelectedNodeId);
    setExportStatus("");

    if (options?.fitView) {
      setFitViewToken((currentToken) => currentToken + 1);
    }

    if (options?.debugEvent) {
      recordMindmapDebugEvent(options.debugEvent, options.debugPayload ?? {}, debugEnabled);
    }
  }

  function updateSelectedNode(
    patch: Partial<Pick<MindmapNode, "color" | "expanded" | "note" | "topic">>,
  ) {
    applyMindmapChange(updateMindmapNode(root, selectedNode.id, patch), {
      debugEvent: "node.update",
      debugPayload: {
        nodeId: selectedNode.id,
        fields: Object.keys(patch),
      },
    });
  }

  function handleResetSample() {
    const nextRoot = createSampleMindmap();

    applyMindmapChange(nextRoot, {
      nextSelectedNodeId: nextRoot.id,
      fitView: true,
      debugEvent: "sample.reset",
      debugPayload: { rootId: nextRoot.id },
    });
  }

  function handleClearMindmap() {
    const nextRoot = createEmptyMindmap();

    applyMindmapChange(nextRoot, {
      nextSelectedNodeId: nextRoot.id,
      fitView: true,
      debugEvent: "mindmap.clear",
      debugPayload: { rootId: nextRoot.id },
    });
  }

  function handleAddChild(targetNodeId = selectedNode.id) {
    const targetNode = findMindmapNode(root, targetNodeId) ?? selectedNode;
    const nextNode = createMindmapNode({
      id: getNextMindmapId(root),
      topic: "새 노드",
      color: getSuggestedMindmapColor(root, targetNode.id),
    });

    applyMindmapChange(insertMindmapChild(root, targetNode.id, nextNode), {
      nextSelectedNodeId: nextNode.id,
      debugEvent: "node.addChild",
      debugPayload: {
        nodeId: nextNode.id,
        parentId: targetNode.id,
      },
    });
  }

  function handleAddSibling() {
    const parentId = selectedFlatNode?.parentId ?? root.id;
    const nextNode = createMindmapNode({
      id: getNextMindmapId(root),
      topic: "새 노드",
      color: getSuggestedMindmapColor(root, parentId),
    });

    applyMindmapChange(insertMindmapSibling(root, selectedNode.id, nextNode), {
      nextSelectedNodeId: nextNode.id,
      debugEvent: "node.addSibling",
      debugPayload: {
        nodeId: nextNode.id,
        siblingOf: selectedNode.id,
      },
    });
  }

  function handleRemoveSelected(targetNodeId = selectedNode.id) {
    const targetNode = findMindmapNode(root, targetNodeId) ?? selectedNode;

    if (targetNode.id === root.id) {
      return;
    }

    const targetFlatNode = flatNodes.find((node) => node.id === targetNode.id);

    applyMindmapChange(removeMindmapNode(root, targetNode.id), {
      nextSelectedNodeId: targetFlatNode?.parentId ?? root.id,
      debugEvent: "node.remove",
      debugPayload: {
        nodeId: targetNode.id,
      },
    });
  }

  function handleRenameNode(targetNodeId: string, nextTopic: string) {
    const trimmedTopic = nextTopic.trim();
    const targetNode = findMindmapNode(root, targetNodeId);

    if (!targetNode || !trimmedTopic || trimmedTopic === targetNode.topic.trim()) {
      return;
    }

    applyMindmapChange(updateMindmapNode(root, targetNode.id, { topic: trimmedTopic }), {
      nextSelectedNodeId: targetNode.id,
      debugEvent: "node.rename",
      debugPayload: {
        nodeId: targetNode.id,
        topic: trimmedTopic,
      },
    });
  }

  function handleUndo() {
    const previousEntry = history[history.length - 1];

    if (!previousEntry) {
      return;
    }

    const restoredRoot = cloneMindmapNode(previousEntry.root);
    const restoredSelectedNodeId = findMindmapNode(restoredRoot, previousEntry.selectedNodeId)
      ? previousEntry.selectedNodeId
      : restoredRoot.id;

    setHistory((currentHistory) => currentHistory.slice(0, -1));
    setRoot(restoredRoot);
    setSelectedNodeId(restoredSelectedNodeId);
    setExportStatus("");
    recordMindmapDebugEvent(
      "mindmap.undo",
      {
        remainingHistory: history.length - 1,
        restoredSelectedNodeId,
      },
      debugEnabled,
    );
  }

  function handlePreviewExportHandleChange(nextHandle: MindmapPreviewExportHandle | null) {
    exportHandleRef.current = nextHandle;
    setIsPreviewExportReady(Boolean(nextHandle));
  }

  async function handleExportImage() {
    if (!exportHandleRef.current || !canExport) {
      return;
    }

    setExportStatus("마인드맵 이미지를 준비하고 있습니다.");

    try {
      const dataUrl = await exportMindmapPreviewImage(exportHandleRef.current);

      downloadDataUrl(dataUrl, createDatedPngFileName("office-tool-mindmap"));
      setExportStatus("마인드맵 이미지를 내보냈습니다.");
      recordMindmapDebugEvent(
        "mindmap.export",
        {
          nodeCount: previewStats.nodeCount,
          selectedNodeId,
        },
        debugEnabled,
      );
    } catch (error) {
      setExportStatus("이미지 내보내기에 실패했습니다.");
      recordMindmapDebugEvent(
        "mindmap.export.error",
        {
          message: error instanceof Error ? error.message : "unknown export error",
        },
        debugEnabled,
      );
    }
  }

  function openColorPickerForNode(targetNodeId = selectedNode.id) {
    const targetNode = findMindmapNode(root, targetNodeId) ?? selectedNode;

    setSelectedNodeId(targetNode.id);
    setColorDialogNodeId(targetNode.id);
    setDraftColor(targetNode.color);
    recordMindmapDebugEvent(
      "node.color.open",
      {
        color: targetNode.color,
        nodeId: targetNode.id,
      },
      debugEnabled,
    );
  }

  function closeColorPicker() {
    setColorDialogNodeId(null);
    setDraftColor(defaultGanttTaskColor);
  }

  function applyDraftColor() {
    if (!colorDialogNode || !canApplyDraftColor) {
      return;
    }

    applyMindmapChange(
      updateMindmapNode(root, colorDialogNode.id, {
        color: previewDraftColor,
      }),
      {
        nextSelectedNodeId: colorDialogNode.id,
        debugEvent: "node.color",
        debugPayload: {
          color: previewDraftColor,
          nodeId: colorDialogNode.id,
        },
      },
    );
    closeColorPicker();
  }

  return (
    <section className="mindmap-editor-shell" aria-label="마인드맵 에디터">
      <div className="action-bar" aria-label="마인드맵 toolbar">
        <button type="button" onClick={handleResetSample}>
          예시 데이터
        </button>
        <button type="button" onClick={handleClearMindmap}>
          전체 초기화
        </button>
        <button disabled={!canUndo} type="button" onClick={handleUndo}>
          실행 취소
        </button>
        <button disabled={!canExport} type="button" onClick={handleExportImage}>
          이미지로 내보내기
        </button>
      </div>

      <div className="mindmap-layout">
        <section className="mindmap-edit-panel" aria-labelledby="mindmap-editor-title">
          <div className="panel-kicker">입력</div>
          <h2 id="mindmap-editor-title">마인드맵 입력</h2>
          <p>
            선택한 노드의 내용을 수정하고, 같은 레벨 또는 하위 노드를 확장하면서 구조를
            정리합니다.
          </p>

          <div className="mindmap-node-actions">
            <button className="primary-action" type="button" onClick={() => handleAddChild()}>
              하위 노드 추가
            </button>
            <button type="button" onClick={handleAddSibling}>
              같은 레벨 추가
            </button>
            <button
              disabled={!canDeleteSelectedNode}
              type="button"
              onClick={() => handleRemoveSelected()}
            >
              노드 삭제
            </button>
            <button type="button" onClick={() => setFitViewToken((value) => value + 1)}>
              맞춰 보기
            </button>
          </div>

          {issues.length > 0 ? (
            <div className="validation-summary" role="alert">
              {issues.length}개의 입력 오류가 있어 수정이 필요합니다.
            </div>
          ) : null}

          <div className="mindmap-outline" aria-label="마인드맵 노드 목록">
            {flatNodes.map((node) => (
              <button
                aria-pressed={node.id === selectedNode.id}
                className="mindmap-outline-row"
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
              >
                <span
                  className="mindmap-outline-indent"
                  style={{ width: `${node.depth * 18}px` }}
                />
                <span className="mindmap-outline-color" style={{ backgroundColor: node.color }} />
                <span className="mindmap-outline-topic">{node.topic.trim() || "제목 없음"}</span>
                <span className="mindmap-outline-meta">
                  {node.childCount > 0 ? `${node.childCount}개` : "leaf"}
                </span>
              </button>
            ))}
          </div>

          <div className="mindmap-node-editor">
            <label>
              <span>이름</span>
              <input
                aria-label={`${selectedNode.topic || "선택 노드"} 이름`}
                value={selectedNode.topic}
                onChange={(event) => updateSelectedNode({ topic: event.target.value })}
              />
            </label>
            <label className="wide-field">
              <span>설명</span>
              <textarea
                aria-label={`${selectedNode.topic || "선택 노드"} 설명`}
                value={selectedNode.note}
                onChange={(event) => updateSelectedNode({ note: event.target.value })}
              />
            </label>
            <label className="color-picker-field">
              <span>색상</span>
              <button
                aria-label={`${selectedNode.topic || "선택 노드"} 색상 선택`}
                className="color-picker-trigger"
                type="button"
                onClick={() => openColorPickerForNode()}
              >
                <span className="color-swatch" style={{ backgroundColor: selectedNode.color }} />
                <span>{selectedNode.color}</span>
              </button>
            </label>
            <label className="checkbox-field">
              <input
                aria-label={`${selectedNode.topic || "선택 노드"} 확장`}
                checked={selectedNode.expanded}
                type="checkbox"
                onChange={(event) => updateSelectedNode({ expanded: event.target.checked })}
              />
              <span>하위 노드 펼침</span>
            </label>
            {selectedNodeIssues.map((issue) => (
              <p className="field-error" key={`${issue.nodeId}-${issue.field}`} role="alert">
                {issue.message}
              </p>
            ))}
          </div>
        </section>

        <section className="mindmap-preview-panel" aria-labelledby="mindmap-preview-title">
          <div className="panel-kicker">미리보기</div>
          <h2 id="mindmap-preview-title">마인드맵 preview</h2>
          <p>
            preview에서 노드를 클릭해 바로 선택할 수 있고, 선택한 노드에는 <code>+</code>와{" "}
            <code>-</code> 버튼이 표시됩니다.
          </p>

          <div className="mindmap-preview-surface">
            <MindmapCanvasPreview
              canRemoveSelectedNode={canDeleteSelectedNode}
              debugEnabled={debugEnabled}
              fitViewToken={fitViewToken}
              root={root}
              selectedNodeId={selectedNode.id}
              onAddChildNode={handleAddChild}
              onExportHandleChange={handlePreviewExportHandleChange}
              onOpenColorPicker={openColorPickerForNode}
              onRemoveNode={handleRemoveSelected}
              onRenameNode={handleRenameNode}
              onSelectNode={setSelectedNodeId}
            />
          </div>

          <div className="preview-meta" aria-live="polite">
            <span>{previewStats.nodeCount}개 노드</span>
            <span>{previewStats.depth}단계 깊이</span>
            <span>{selectedNode.topic.trim() || "제목 없음"} 선택됨</span>
          </div>
          {exportStatus ? <p className="export-status">{exportStatus}</p> : null}
        </section>
      </div>

      {colorDialogNode ? (
        <ColorPickerDialog
          canApply={canApplyDraftColor}
          currentColor={previewDraftColor}
          draftColor={draftColor}
          helpText="프리셋에서 고르거나 직접 색상과 HEX 값을 지정합니다."
          invalidMessage="#RRGGBB 형식으로 색상을 입력해 주세요."
          options={ganttTaskColorOptions}
          title={`${colorDialogNode.topic || "선택 노드"} 색상 선택`}
          onApply={applyDraftColor}
          onClose={closeColorPicker}
          onDraftColorChange={setDraftColor}
        />
      ) : null}
    </section>
  );
}
