"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ColorPickerDialog } from "@/components/shared/ColorPickerDialog";
import {
  defaultGanttTaskColor,
  ganttTaskColorOptions,
  isValidGanttTaskColor,
  normalizeGanttTaskColor,
} from "@/lib/gantt/taskModel";
import { createDatedPngFileName, downloadDataUrl } from "@/lib/shared/download";
import { exportOrgChartPreviewImage } from "@/lib/orgChart/export";
import {
  addOrgChartNode,
  createSampleOrgChartState,
  getOrgChartParentOptions,
  getOrgChartStatusLabel,
  getValidOrgChartNodes,
  orgChartDirectionOptions,
  orgChartStatusOptions,
  removeOrgChartNode,
  updateOrgChartNode,
  validateOrgChartState,
} from "@/lib/orgChart/model";
import { readOrgChartDebugEnabled, recordOrgChartDebugEvent } from "@/lib/orgChart/debug";
import { OrgChartPreview } from "./OrgChartPreview";

const initialState = createSampleOrgChartState();

export function OrgChartEditorShell() {
  const [orgName, setOrgName] = useState(initialState.orgName);
  const [direction, setDirection] = useState(initialState.direction);
  const [nodes, setNodes] = useState(initialState.nodes);
  const [selectedNodeId, setSelectedNodeId] = useState(initialState.selectedNodeId);
  const [exportStatus, setExportStatus] = useState("");
  const [colorDialogNodeId, setColorDialogNodeId] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState(defaultGanttTaskColor);
  const debugEnabled = useState(() => readOrgChartDebugEnabled())[0];
  const previewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const issues = useMemo(() => validateOrgChartState(nodes), [nodes]);
  const previewNodes = useMemo(() => getValidOrgChartNodes(nodes), [nodes]);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0];
  const colorDialogNode = nodes.find((node) => node.id === colorDialogNodeId);
  const previewDraftColor = normalizeGanttTaskColor(draftColor);
  const canApplyDraftColor = isValidGanttTaskColor(previewDraftColor);
  const canExport = previewNodes.length > 0 && issues.length === 0;

  useEffect(() => {
    if (!selectedNodeId) {
      return;
    }

    const node = itemRefs.current.get(selectedNodeId);

    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedNodeId]);

  function setItemRef(nodeId: string, element: HTMLDivElement | null) {
    if (!element) {
      itemRefs.current.delete(nodeId);
      return;
    }

    itemRefs.current.set(nodeId, element);
  }

  function handleResetSample() {
    const nextState = createSampleOrgChartState();

    setOrgName(nextState.orgName);
    setDirection(nextState.direction);
    setNodes(nextState.nodes);
    setSelectedNodeId(nextState.selectedNodeId);
    setExportStatus("");
    recordOrgChartDebugEvent("sample.reset", nextState, debugEnabled);
  }

  function handleClear() {
    setOrgName("새 조직도");
    setDirection("top");
    setNodes([]);
    setSelectedNodeId(undefined);
    setExportStatus("");
    recordOrgChartDebugEvent("orgchart.clear", {}, debugEnabled);
  }

  function handleAddNode() {
    const nextNodes = addOrgChartNode(nodes, selectedNode?.id ?? null);
    const nextNodeId = nextNodes[nextNodes.length - 1]?.id;

    setNodes(nextNodes);
    setSelectedNodeId(nextNodeId);
    recordOrgChartDebugEvent(
      "node.add",
      {
        parentId: selectedNode?.id ?? null,
        nodeId: nextNodeId,
      },
      debugEnabled,
    );
  }

  function handleRemoveNode(nodeId: string) {
    const nextNodes = removeOrgChartNode(nodes, nodeId);
    const nextSelectedNodeId =
      selectedNodeId === nodeId || !nextNodes.some((node) => node.id === selectedNodeId)
        ? nextNodes[0]?.id
        : selectedNodeId;

    setNodes(nextNodes);
    setSelectedNodeId(nextSelectedNodeId);
    recordOrgChartDebugEvent("node.remove", { nodeId }, debugEnabled);
  }

  function handleNodeChange(
    nodeId: string,
    field: "name" | "title" | "department" | "status" | "notes" | "color",
    value: string,
  ) {
    setNodes((currentNodes) =>
      updateOrgChartNode(currentNodes, nodeId, {
        [field]: value,
      }),
    );
  }

  function handleParentChange(nodeId: string, parentId: string) {
    setNodes((currentNodes) =>
      updateOrgChartNode(currentNodes, nodeId, {
        parentId: parentId || null,
      }),
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
      updateOrgChartNode(currentNodes, colorDialogNode.id, {
        color: previewDraftColor,
      }),
    );
    closeColorPicker();
  }

  async function handleExportImage() {
    if (!previewRef.current || !canExport) {
      return;
    }

    setExportStatus("조직도 이미지를 준비하는 중입니다.");

    try {
      const dataUrl = await exportOrgChartPreviewImage(previewRef.current);

      downloadDataUrl(dataUrl, createDatedPngFileName("office-tool-org-chart"));
      setExportStatus("조직도 이미지를 내보냈습니다.");
      recordOrgChartDebugEvent(
        "orgchart.export",
        {
          nodeCount: previewNodes.length,
          direction,
        },
        debugEnabled,
      );
    } catch (error) {
      setExportStatus("이미지 내보내기에 실패했습니다.");
      recordOrgChartDebugEvent(
        "orgchart.export.error",
        {
          message:
            error instanceof Error ? error.message : "unknown export error",
        },
        debugEnabled,
      );
    }
  }

  const issuesByNodeId = useMemo(() => {
    const map = new Map<string, string[]>();

    issues.forEach((issue) => {
      const bucket = map.get(issue.nodeId) ?? [];

      bucket.push(issue.message);
      map.set(issue.nodeId, bucket);
    });

    return map;
  }, [issues]);

  return (
    <section className="diagram-editor-shell" aria-label="조직도 에디터">
      <div className="action-bar" aria-label="조직도 toolbar">
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
        <section className="diagram-edit-panel" aria-labelledby="orgchart-editor-title">
          <div className="panel-kicker">입력</div>
          <h2 id="orgchart-editor-title">조직도 입력</h2>
          <p>이름, 직책, 상위 항목을 입력하면 문서형 조직도 preview가 바로 갱신됩니다.</p>

          <div className="diagram-meta-grid">
            <label>
              <span>조직명</span>
              <input
                aria-label="조직명"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
              />
            </label>
            <label>
              <span>보기 방향</span>
              <select
                aria-label="보기 방향"
                value={direction}
                onChange={(event) =>
                  setDirection(event.target.value as typeof direction)
                }
              >
                {orgChartDirectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="diagram-section-heading">
            <h3>조직 항목</h3>
            <button className="primary-action" type="button" onClick={handleAddNode}>
              항목 추가
            </button>
          </div>

          {issues.length > 0 ? (
            <div className="validation-summary" role="alert">
              {issues.length}개의 입력 오류가 있어 정상 항목만 preview에 반영됩니다.
            </div>
          ) : null}

          {nodes.length === 0 ? (
            <div className="empty-state">조직 항목을 추가하면 preview가 표시됩니다.</div>
          ) : (
            <div className="diagram-item-list" aria-label="조직 항목 목록">
              {nodes.map((node) => (
                <div
                  aria-selected={selectedNodeId === node.id}
                  className={
                    selectedNodeId === node.id
                      ? "diagram-item-card selected"
                      : "diagram-item-card"
                  }
                  key={node.id}
                  ref={(element) => setItemRef(node.id, element)}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <div className="diagram-item-grid">
                    <label>
                      <span>이름</span>
                      <input
                        aria-label={`${node.name} 이름`}
                        value={node.name}
                        onChange={(event) =>
                          handleNodeChange(node.id, "name", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>직책</span>
                      <input
                        aria-label={`${node.name} 직책`}
                        value={node.title ?? ""}
                        onChange={(event) =>
                          handleNodeChange(node.id, "title", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>상위 항목</span>
                      <select
                        aria-label={`${node.name} 상위 항목`}
                        value={node.parentId ?? ""}
                        onChange={(event) =>
                          handleParentChange(node.id, event.target.value)
                        }
                      >
                        <option value="">최상위 항목</option>
                        {getOrgChartParentOptions(nodes, node.id).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>부서</span>
                      <input
                        aria-label={`${node.name} 부서`}
                        value={node.department ?? ""}
                        onChange={(event) =>
                          handleNodeChange(node.id, "department", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span>상태</span>
                      <select
                        aria-label={`${node.name} 상태`}
                        value={node.status ?? "active"}
                        onChange={(event) =>
                          handleNodeChange(node.id, "status", event.target.value)
                        }
                      >
                        {orgChartStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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
                          handleNodeChange(node.id, "notes", event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <div className="diagram-item-footer">
                    <span className="diagram-item-chip">
                      {getOrgChartStatusLabel(node.status)}
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

                  {(issuesByNodeId.get(node.id) ?? []).map((message) => (
                    <p className="field-error" key={`${node.id}-${message}`} role="alert">
                      {message}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="diagram-preview-panel" aria-labelledby="orgchart-preview-title">
          <div className="panel-kicker">미리보기</div>
          <h2 id="orgchart-preview-title">조직도 preview</h2>
          <p>카드형 조직 구조를 문서용 결과로 바로 확인하고 PNG로 저장합니다.</p>

          <div className="diagram-preview-surface" ref={previewRef}>
            <OrgChartPreview
              direction={direction}
              nodes={previewNodes}
              orgName={orgName}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />
          </div>

          <div className="preview-meta" aria-live="polite">
            <span>{previewNodes.length}개 카드</span>
            <span>{orgName}</span>
            <span>
              {
                orgChartDirectionOptions.find((option) => option.value === direction)
                  ?.label
              }
            </span>
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
