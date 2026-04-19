"use client";

import { useMemo, useRef, useState } from "react";
import { ColorPickerDialog } from "@/components/shared/ColorPickerDialog";
import {
  defaultGanttTaskColor,
  ganttTaskColorOptions,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";
import {
  addFlowchartEdge,
  addFlowchartNode,
  createSampleFlowchartState,
  flowchartNodeTypeOptions,
  flowchartStatusOptions,
  getFlowchartNodeOptions,
  removeFlowchartEdge,
  removeFlowchartNode,
  updateFlowchartEdge,
  updateFlowchartNode,
  validateFlowchartState,
} from "@/lib/flowchart/model";
import { readFlowchartDebugEnabled, recordFlowchartDebugEvent } from "@/lib/flowchart/debug";
import { exportFlowchartPreviewImage } from "@/lib/flowchart/export";
import { createDatedPngFileName, downloadDataUrl } from "@/lib/shared/download";
import { FlowchartPreview } from "./FlowchartPreview";

const initialState = createSampleFlowchartState();

export function FlowchartEditorShell() {
  const [title, setTitle] = useState(initialState.title);
  const [nodes, setNodes] = useState(initialState.nodes);
  const [edges, setEdges] = useState(initialState.edges);
  const [selectedNodeId, setSelectedNodeId] = useState(initialState.selectedNodeId);
  const [exportStatus, setExportStatus] = useState("");
  const [colorDialogNodeId, setColorDialogNodeId] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState(defaultGanttTaskColor);
  const debugEnabled = useState(() => readFlowchartDebugEnabled())[0];
  const previewRef = useRef<HTMLDivElement>(null);
  const issues = useMemo(
    () =>
      validateFlowchartState({
        title,
        nodes,
        edges,
        selectedNodeId,
      }),
    [edges, nodes, selectedNodeId, title],
  );
  const colorDialogNode = nodes.find((node) => node.id === colorDialogNodeId);
  const previewDraftColor = normalizeGanttTaskColor(draftColor);
  const canApplyDraftColor = isValidGanttTaskColor(previewDraftColor);
  const canExport = nodes.length > 0 && issues.length === 0;

  const nodeIssues = useMemo(() => {
    const map = new Map<string, string[]>();

    issues
      .filter((issue) => issue.nodeId)
      .forEach((issue) => {
        const bucket = map.get(issue.nodeId as string) ?? [];

        bucket.push(issue.message);
        map.set(issue.nodeId as string, bucket);
      });

    return map;
  }, [issues]);

  const edgeIssues = useMemo(() => {
    const map = new Map<string, string[]>();

    issues
      .filter((issue) => issue.edgeId)
      .forEach((issue) => {
        const bucket = map.get(issue.edgeId as string) ?? [];

        bucket.push(issue.message);
        map.set(issue.edgeId as string, bucket);
      });

    return map;
  }, [issues]);

  function handleResetSample() {
    const nextState = createSampleFlowchartState();

    setTitle(nextState.title);
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setSelectedNodeId(nextState.selectedNodeId);
    setExportStatus("");
    recordFlowchartDebugEvent("sample.reset", nextState, debugEnabled);
  }

  function handleClear() {
    setTitle("새 플로우차트");
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(undefined);
    setExportStatus("");
    recordFlowchartDebugEvent("flowchart.clear", {}, debugEnabled);
  }

  function handleAddNode() {
    const nextNodes = addFlowchartNode(nodes);
    const nextNodeId = nextNodes[nextNodes.length - 1]?.id;

    setNodes(nextNodes);
    setSelectedNodeId(nextNodeId);
    recordFlowchartDebugEvent("node.add", { nodeId: nextNodeId }, debugEnabled);
  }

  function handleRemoveNode(nodeId: string) {
    const nextState = removeFlowchartNode(nodes, edges, nodeId);

    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setSelectedNodeId(nextState.nodes[0]?.id);
    recordFlowchartDebugEvent("node.remove", { nodeId }, debugEnabled);
  }

  function handleAddEdge() {
    const nextEdges = addFlowchartEdge(nodes, edges);

    setEdges(nextEdges);
    recordFlowchartDebugEvent(
      "edge.add",
      { edgeId: nextEdges[nextEdges.length - 1]?.id },
      debugEnabled,
    );
  }

  function openColorPicker(nodeId: string) {
    const node = nodes.find((candidate) => candidate.id === nodeId);

    setColorDialogNodeId(nodeId);
    setDraftColor(node?.color ?? defaultGanttTaskColor);
  }

  function closeColorPicker() {
    setColorDialogNodeId(null);
    setDraftColor(defaultGanttTaskColor);
  }

  function applyDraftColor() {
    if (!colorDialogNode || !canApplyDraftColor) {
      return;
    }

    setNodes((currentNodes) =>
      updateFlowchartNode(currentNodes, colorDialogNode.id, {
        color: previewDraftColor,
      }),
    );
    closeColorPicker();
  }

  async function handleExportImage() {
    if (!previewRef.current || !canExport) {
      return;
    }

    setExportStatus("플로우차트 이미지를 준비하는 중입니다.");

    try {
      const dataUrl = await exportFlowchartPreviewImage(previewRef.current);

      downloadDataUrl(dataUrl, createDatedPngFileName("office-tool-flowchart"));
      setExportStatus("플로우차트 이미지를 내보냈습니다.");
      recordFlowchartDebugEvent(
        "flowchart.export",
        {
          nodeCount: nodes.length,
          edgeCount: edges.length,
        },
        debugEnabled,
      );
    } catch (error) {
      setExportStatus("이미지 내보내기에 실패했습니다.");
      recordFlowchartDebugEvent(
        "flowchart.export.error",
        {
          message:
            error instanceof Error ? error.message : "unknown export error",
        },
        debugEnabled,
      );
    }
  }

  return (
    <section className="diagram-editor-shell" aria-label="플로우차트 에디터">
      <div className="action-bar" aria-label="플로우차트 toolbar">
        <button type="button" onClick={handleResetSample}>
          예시 데이터
        </button>
        <button type="button" onClick={handleClear}>
          전체 초기화
        </button>
        <button disabled={!canExport} type="button" onClick={handleExportImage}>
          이미지로 내보내기
        </button>
      </div>

      <div className="diagram-layout">
        <section className="diagram-edit-panel" aria-labelledby="flowchart-editor-title">
          <div className="panel-kicker">입력</div>
          <h2 id="flowchart-editor-title">플로우차트 입력</h2>
          <p>단계와 연결을 따로 관리해 분기와 종료 조건을 안정적으로 입력합니다.</p>

          <div className="diagram-meta-grid">
            <label>
              <span>플로우차트명</span>
              <input
                aria-label="플로우차트명"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
          </div>

          {issues.length > 0 ? (
            <div className="validation-summary" role="alert">
              {issues.length}개의 입력 오류가 있습니다. 시작/종료/연결 조건을 확인해 주세요.
            </div>
          ) : null}

          <div className="diagram-section-heading">
            <h3>단계</h3>
            <button className="primary-action" type="button" onClick={handleAddNode}>
              단계 추가
            </button>
          </div>

          {nodes.length === 0 ? (
            <div className="empty-state">단계를 추가하면 플로우차트가 시작됩니다.</div>
          ) : (
            <div className="diagram-item-list" aria-label="단계 목록">
              {nodes.map((node) => (
                <div
                  aria-selected={selectedNodeId === node.id}
                  className={
                    selectedNodeId === node.id
                      ? "diagram-item-card selected"
                      : "diagram-item-card"
                  }
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <div className="diagram-item-grid">
                    <label>
                      <span>단계명</span>
                      <input
                        aria-label={`${node.name} 단계명`}
                        value={node.name}
                        onChange={(event) =>
                          setNodes((currentNodes) =>
                            updateFlowchartNode(currentNodes, node.id, {
                              name: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>단계 유형</span>
                      <select
                        aria-label={`${node.name} 단계 유형`}
                        value={node.type}
                        onChange={(event) =>
                          setNodes((currentNodes) =>
                            updateFlowchartNode(currentNodes, node.id, {
                              type: event.target.value as typeof node.type,
                            }),
                          )
                        }
                      >
                        {flowchartNodeTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>그룹</span>
                      <input
                        aria-label={`${node.name} 그룹`}
                        value={node.lane ?? ""}
                        onChange={(event) =>
                          setNodes((currentNodes) =>
                            updateFlowchartNode(currentNodes, node.id, {
                              lane: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>상태</span>
                      <select
                        aria-label={`${node.name} 상태`}
                        value={node.status ?? "default"}
                        onChange={(event) =>
                          setNodes((currentNodes) =>
                            updateFlowchartNode(currentNodes, node.id, {
                              status: event.target.value as typeof node.status,
                            }),
                          )
                        }
                      >
                        {flowchartStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>담당자</span>
                      <input
                        aria-label={`${node.name} 담당자`}
                        value={node.owner ?? ""}
                        onChange={(event) =>
                          setNodes((currentNodes) =>
                            updateFlowchartNode(currentNodes, node.id, {
                              owner: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                    <label className="color-picker-field">
                      <span>색상</span>
                      <button
                        className="color-picker-trigger"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openColorPicker(node.id);
                        }}
                      >
                        <span
                          className="color-swatch"
                          style={{ backgroundColor: normalizeGanttTaskColor(node.color) }}
                        />
                        <span>{normalizeGanttTaskColor(node.color)}</span>
                      </button>
                    </label>
                    <label className="wide-field">
                      <span>설명</span>
                      <textarea
                        aria-label={`${node.name} 설명`}
                        value={node.notes ?? ""}
                        onChange={(event) =>
                          setNodes((currentNodes) =>
                            updateFlowchartNode(currentNodes, node.id, {
                              notes: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="diagram-item-footer">
                    <span className="diagram-item-chip">
                      {
                        flowchartNodeTypeOptions.find(
                          (option) => option.value === node.type,
                        )?.label
                      }
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveNode(node.id);
                      }}
                    >
                      삭제
                    </button>
                  </div>

                  {(nodeIssues.get(node.id) ?? []).map((message) => (
                    <p className="field-error" key={`${node.id}-${message}`} role="alert">
                      {message}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="diagram-section-heading top-spaced">
            <h3>연결</h3>
            <button
              className="primary-action"
              disabled={nodes.length < 2}
              type="button"
              onClick={handleAddEdge}
            >
              연결 추가
            </button>
          </div>

          {edges.length === 0 ? (
            <div className="empty-state">연결을 추가하면 분기와 흐름이 표시됩니다.</div>
          ) : (
            <div className="diagram-item-list" aria-label="연결 목록">
              {edges.map((edge) => (
                <div className="diagram-item-card compact" key={edge.id}>
                  <div className="diagram-item-grid compact">
                    <label>
                      <span>출발 단계</span>
                      <select
                        aria-label={`${edge.id} 출발 단계`}
                        value={edge.sourceId}
                        onChange={(event) =>
                          setEdges((currentEdges) =>
                            updateFlowchartEdge(currentEdges, edge.id, {
                              sourceId: event.target.value,
                            }),
                          )
                        }
                      >
                        {getFlowchartNodeOptions(nodes, edge.targetId).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>도착 단계</span>
                      <select
                        aria-label={`${edge.id} 도착 단계`}
                        value={edge.targetId}
                        onChange={(event) =>
                          setEdges((currentEdges) =>
                            updateFlowchartEdge(currentEdges, edge.id, {
                              targetId: event.target.value,
                            }),
                          )
                        }
                      >
                        {getFlowchartNodeOptions(nodes, edge.sourceId).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>조건 라벨</span>
                      <input
                        aria-label={`${edge.id} 조건 라벨`}
                        placeholder="예 / 아니오"
                        value={edge.label ?? ""}
                        onChange={(event) =>
                          setEdges((currentEdges) =>
                            updateFlowchartEdge(currentEdges, edge.id, {
                              label: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="diagram-item-footer">
                    <span className="diagram-item-chip">연결</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEdges((currentEdges) =>
                          removeFlowchartEdge(currentEdges, edge.id),
                        )
                      }
                    >
                      삭제
                    </button>
                  </div>
                  {(edgeIssues.get(edge.id) ?? []).map((message) => (
                    <p className="field-error" key={`${edge.id}-${message}`} role="alert">
                      {message}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="diagram-preview-panel" aria-labelledby="flowchart-preview-title">
          <div className="panel-kicker">미리보기</div>
          <h2 id="flowchart-preview-title">플로우차트 preview</h2>
          <p>단계와 연결을 한 화면에서 확인하고, 문서용 이미지로 바로 저장합니다.</p>

          <div className="diagram-preview-surface" ref={previewRef}>
            <FlowchartPreview
              selectedNodeId={selectedNodeId}
              state={{ title, nodes, edges, selectedNodeId }}
              onSelectNode={setSelectedNodeId}
            />
          </div>

          <div className="preview-meta" aria-live="polite">
            <span>{nodes.length}개 단계</span>
            <span>{edges.length}개 연결</span>
            <span>{title}</span>
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
          invalidMessage="#RRGGBB 형식의 색상을 입력해 주세요."
          options={ganttTaskColorOptions}
          title={`${colorDialogNode.name} 색상 선택`}
          onApply={applyDraftColor}
          onClose={closeColorPicker}
          onDraftColorChange={setDraftColor}
        />
      ) : null}
    </section>
  );
}
