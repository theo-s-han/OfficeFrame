"use client";

import { useMemo, useRef, useState } from "react";
import {
  defaultGanttTaskColor,
  ganttTaskColorOptions,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";
import { exportMindmapPreviewImage } from "@/lib/mindmap/export";
import {
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
import { readMindmapDebugEnabled, recordMindmapDebugEvent } from "@/lib/mindmap/debug";
import { MindmapCanvasPreview } from "./MindmapCanvasPreview";

const initialMindmap = createSampleMindmap();

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");

  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

function createMindmapExportFileName() {
  return `office-tool-mindmap-${new Date()
    .toISOString()
    .slice(0, 10)}.png`;
}

export function MindmapEditorShell() {
  const [root, setRoot] = useState(initialMindmap);
  const [selectedNodeId, setSelectedNodeId] = useState(initialMindmap.id);
  const [exportStatus, setExportStatus] = useState("");
  const [fitViewToken, setFitViewToken] = useState(0);
  const [colorDialogNodeId, setColorDialogNodeId] = useState<string | null>(
    null,
  );
  const [draftColor, setDraftColor] = useState(defaultGanttTaskColor);
  const debugEnabled = useState(() => readMindmapDebugEnabled())[0];
  const previewRef = useRef<HTMLDivElement>(null);
  const flatNodes = useMemo(() => flattenMindmap(root), [root]);
  const selectedNode = findMindmapNode(root, selectedNodeId) ?? root;
  const selectedFlatNode = flatNodes.find((node) => node.id === selectedNode.id);
  const issues = useMemo(() => validateMindmap(root), [root]);
  const selectedNodeIssues = issues.filter(
    (issue) => issue.nodeId === selectedNode.id,
  );
  const canExport = issues.length === 0;
  const canDeleteSelectedNode = selectedNode.id !== root.id;
  const previewStats = useMemo(
    () => ({
      nodeCount: countMindmapNodes(root),
      depth: getMindmapDepth(root),
    }),
    [root],
  );
  const colorDialogNode = colorDialogNodeId
    ? findMindmapNode(root, colorDialogNodeId)
    : undefined;
  const previewDraftColor = normalizeGanttTaskColor(draftColor);
  const canApplyDraftColor = isValidGanttTaskColor(previewDraftColor);

  function updateSelectedNode(
    patch: Partial<Pick<MindmapNode, "color" | "expanded" | "note" | "topic">>,
  ) {
    setRoot((currentRoot) => updateMindmapNode(currentRoot, selectedNode.id, patch));
  }

  function handleResetSample() {
    const nextRoot = createSampleMindmap();

    setRoot(nextRoot);
    setSelectedNodeId(nextRoot.id);
    setFitViewToken((currentToken) => currentToken + 1);
    setExportStatus("");
    recordMindmapDebugEvent("sample.reset", { rootId: nextRoot.id }, debugEnabled);
  }

  function handleClearMindmap() {
    const nextRoot = createEmptyMindmap();

    setRoot(nextRoot);
    setSelectedNodeId(nextRoot.id);
    setFitViewToken((currentToken) => currentToken + 1);
    setExportStatus("");
    recordMindmapDebugEvent("mindmap.clear", { rootId: nextRoot.id }, debugEnabled);
  }

  function handleAddChild() {
    const nextNode = createMindmapNode({
      id: getNextMindmapId(root),
      topic: "새 노드",
      color: getSuggestedMindmapColor(root, selectedNode.id),
    });

    setRoot((currentRoot) =>
      insertMindmapChild(currentRoot, selectedNode.id, nextNode),
    );
    setSelectedNodeId(nextNode.id);
  }

  function handleAddSibling() {
    const parentId = selectedFlatNode?.parentId ?? root.id;
    const nextNode = createMindmapNode({
      id: getNextMindmapId(root),
      topic: "새 노드",
      color: getSuggestedMindmapColor(root, parentId),
    });

    setRoot((currentRoot) =>
      insertMindmapSibling(currentRoot, selectedNode.id, nextNode),
    );
    setSelectedNodeId(nextNode.id);
  }

  function handleRemoveSelected() {
    if (!canDeleteSelectedNode) {
      return;
    }

    const nextSelectedNodeId = selectedFlatNode?.parentId ?? root.id;

    setRoot((currentRoot) => removeMindmapNode(currentRoot, selectedNode.id));
    setSelectedNodeId(nextSelectedNodeId);
  }

  async function handleExportImage() {
    if (!previewRef.current || !canExport) {
      return;
    }

    setExportStatus("마인드맵 이미지를 준비하는 중입니다.");

    try {
      const dataUrl = await exportMindmapPreviewImage(previewRef.current);

      downloadDataUrl(dataUrl, createMindmapExportFileName());
      setExportStatus("마인드맵 이미지를 저장했습니다.");
      recordMindmapDebugEvent(
        "mindmap.export",
        { selectedNodeId, nodeCount: previewStats.nodeCount },
        debugEnabled,
      );
    } catch (error) {
      setExportStatus("이미지 내보내기에 실패했습니다.");
      recordMindmapDebugEvent(
        "mindmap.export.error",
        {
          message:
            error instanceof Error ? error.message : "unknown export error",
        },
        debugEnabled,
      );
    }
  }

  function openColorPicker() {
    setColorDialogNodeId(selectedNode.id);
    setDraftColor(selectedNode.color);
  }

  function closeColorPicker() {
    setColorDialogNodeId(null);
    setDraftColor(defaultGanttTaskColor);
  }

  function applyDraftColor() {
    if (!colorDialogNode || !canApplyDraftColor) {
      return;
    }

    setRoot((currentRoot) =>
      updateMindmapNode(currentRoot, colorDialogNode.id, {
        color: previewDraftColor,
      }),
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
        <button disabled={!canExport} type="button" onClick={handleExportImage}>
          이미지로 내보내기
        </button>
      </div>

      <div className="mindmap-layout">
        <section className="mindmap-edit-panel" aria-labelledby="mindmap-editor-title">
          <div className="panel-kicker">입력</div>
          <h2 id="mindmap-editor-title">마인드맵 입력</h2>
          <p>선택한 노드를 수정하고, 같은 흐름 안에서 하위 노드와 같은 레벨 노드를 추가합니다.</p>

          <div className="mindmap-node-actions">
            <button className="primary-action" type="button" onClick={handleAddChild}>
              하위 노드 추가
            </button>
            <button type="button" onClick={handleAddSibling}>
              같은 레벨 추가
            </button>
            <button
              disabled={!canDeleteSelectedNode}
              type="button"
              onClick={handleRemoveSelected}
            >
              노드 삭제
            </button>
            <button type="button" onClick={() => setFitViewToken((value) => value + 1)}>
              맞춤 보기
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
                <span
                  className="mindmap-outline-color"
                  style={{ backgroundColor: node.color }}
                />
                <span className="mindmap-outline-topic">
                  {node.topic.trim() || "제목 없음"}
                </span>
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
                onChange={(event) =>
                  updateSelectedNode({ topic: event.target.value })
                }
              />
            </label>
            <label className="wide-field">
              <span>설명</span>
              <textarea
                aria-label={`${selectedNode.topic || "선택 노드"} 설명`}
                value={selectedNode.note}
                onChange={(event) =>
                  updateSelectedNode({ note: event.target.value })
                }
              />
            </label>
            <label className="color-picker-field">
              <span>색상</span>
              <button
                aria-label={`${selectedNode.topic || "선택 노드"} 색상 선택`}
                className="color-picker-trigger"
                type="button"
                onClick={openColorPicker}
              >
                <span
                  className="color-swatch"
                  style={{ backgroundColor: selectedNode.color }}
                />
                <span>{selectedNode.color}</span>
              </button>
            </label>
            <label className="checkbox-field">
              <input
                aria-label={`${selectedNode.topic || "선택 노드"} 접힘`}
                checked={selectedNode.expanded}
                type="checkbox"
                onChange={(event) =>
                  updateSelectedNode({ expanded: event.target.checked })
                }
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
          <p>문서용 결과를 기준으로 정돈된 구조를 확인하고, 마우스로 이동하며 전체 흐름을 볼 수 있습니다.</p>

          <div className="mindmap-preview-surface" ref={previewRef}>
            <MindmapCanvasPreview
              debugEnabled={debugEnabled}
              fitViewToken={fitViewToken}
              root={root}
              selectedNodeId={selectedNode.id}
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
        <div
          className="color-picker-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeColorPicker();
            }
          }}
        >
          <section
            aria-labelledby="mindmap-color-picker-title"
            aria-modal="true"
            className="color-picker-dialog"
            role="dialog"
          >
            <header className="color-picker-header">
              <div>
                <div className="panel-kicker">색상</div>
                <h2 id="mindmap-color-picker-title">
                  {colorDialogNode.topic || "선택 노드"} 색상 선택
                </h2>
              </div>
              <button
                aria-label="색상 선택 닫기"
                className="modal-close-button"
                type="button"
                onClick={closeColorPicker}
              >
                닫기
              </button>
            </header>

            <p className="color-picker-help">
              프리셋에서 고르거나 직접 색상과 HEX 값을 지정합니다.
            </p>

            <div className="color-picker-current">
              <span
                className="color-picker-current-swatch"
                style={{ backgroundColor: previewDraftColor }}
              />
              <strong>{previewDraftColor}</strong>
            </div>

            <div className="color-preset-grid" aria-label="마인드맵 색상 프리셋">
              {ganttTaskColorOptions.map((option) => (
                <button
                  aria-label={`${option.label} ${option.value}`}
                  aria-pressed={previewDraftColor === option.value}
                  className="color-preset-button"
                  key={option.value}
                  type="button"
                  onClick={() => setDraftColor(option.value)}
                >
                  <span
                    className="color-swatch"
                    style={{ backgroundColor: option.value }}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="custom-color-controls">
              <label>
                <span>직접 선택</span>
                <input
                  aria-label="사용자 지정 색상"
                  type="color"
                  value={previewDraftColor}
                  onChange={(event) => setDraftColor(event.target.value)}
                />
              </label>
              <label>
                <span>HEX</span>
                <input
                  aria-label="HEX 색상 코드"
                  maxLength={7}
                  placeholder="#5B6EE1"
                  value={draftColor}
                  onChange={(event) => setDraftColor(event.target.value)}
                />
              </label>
            </div>

            {!canApplyDraftColor ? (
              <p className="field-error" role="alert">
                #RRGGBB 형식의 색상을 입력해 주세요.
              </p>
            ) : null}

            <footer className="color-picker-actions">
              <button type="button" onClick={closeColorPicker}>
                취소
              </button>
              <button
                className="primary-action"
                disabled={!canApplyDraftColor}
                type="button"
                onClick={applyDraftColor}
              >
                적용
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
