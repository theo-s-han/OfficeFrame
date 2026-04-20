"use client";

import { useMemo, useRef, useState, type SetStateAction } from "react";
import {
  addFlowchartBranch,
  addFlowchartStep,
  createEmptyFlowchartDocument,
  createSampleFlowchartDocument,
  flowchartDirectionOptions,
  flowchartNodeTypeOptions,
  getFlowchartConnections,
  getFlowchartStepOptions,
  hasBlockingFlowchartIssues,
  removeFlowchartBranch,
  removeFlowchartStep,
  updateFlowchartBranch,
  updateFlowchartStep,
  validateFlowchartDocument,
  type FlowchartDocument,
  type FlowchartNodeType,
} from "@/lib/flowchart/model";
import {
  readFlowchartDebugEnabled,
  recordFlowchartDebugEvent,
} from "@/lib/flowchart/debug";
import { exportFlowchartPreviewImage } from "@/lib/flowchart/export";
import {
  createDatedPngFileName,
  downloadDataUrl,
} from "@/lib/shared/download";
import { FlowchartPreview } from "./FlowchartPreview";

const initialDocument = createSampleFlowchartDocument();

function getFlowchartStepLabel(nodeType: FlowchartNodeType) {
  if (nodeType === "decision") {
    return "판단 질문";
  }

  if (nodeType === "start") {
    return "시작 단계명";
  }

  if (nodeType === "end") {
    return "종료 단계명";
  }

  return "단계명";
}

function getFlowchartStepLabelPlaceholder(nodeType: FlowchartNodeType) {
  if (nodeType === "start") {
    return "예: 요청 접수";
  }

  if (nodeType === "decision") {
    return "예: 기존 템플릿으로 처리 가능한가?";
  }

  if (nodeType === "document") {
    return "예: 검토 문서 작성";
  }

  if (nodeType === "data") {
    return "예: 입력 데이터 확인";
  }

  if (nodeType === "subprocess") {
    return "예: 검증 작업 묶음 실행";
  }

  if (nodeType === "end") {
    return "예: 완료";
  }

  return "예: 요청 내용 확인";
}

function getFlowchartInputLabel(nodeType: FlowchartNodeType) {
  if (nodeType === "document") {
    return "입력 문서";
  }

  if (nodeType === "data") {
    return "입력 데이터";
  }

  if (nodeType === "decision") {
    return "판단 입력";
  }

  return "입력값";
}

function getFlowchartOutputLabel(nodeType: FlowchartNodeType) {
  if (nodeType === "document") {
    return "출력 문서";
  }

  if (nodeType === "data") {
    return "출력 데이터";
  }

  if (nodeType === "end") {
    return "종료 결과";
  }

  return "출력값";
}

function getFlowchartNotesLabel(nodeType: FlowchartNodeType) {
  if (nodeType === "decision") {
    return "판단 기준";
  }

  if (nodeType === "start") {
    return "시작 조건 설명";
  }

  if (nodeType === "end") {
    return "종료 설명";
  }

  return "단계 설명";
}

export function FlowchartEditorShell() {
  const [document, setDocument] = useState(initialDocument);
  const [selectedStepId, setSelectedStepId] = useState<string | undefined>(
    initialDocument.steps[0]?.id,
  );
  const [exportStatus, setExportStatus] = useState("");
  const debugEnabled = useState(() => readFlowchartDebugEnabled())[0];
  const previewRef = useRef<HTMLDivElement>(null);

  const issues = useMemo(() => validateFlowchartDocument(document), [document]);
  const blockingIssues = issues.filter((issue) => issue.severity === "error");
  const warningIssues = issues.filter((issue) => issue.severity === "warning");
  const connectionCount = useMemo(
    () => getFlowchartConnections(document).length,
    [document],
  );
  const canExport =
    document.steps.length > 0 && !hasBlockingFlowchartIssues(issues);

  const stepIssues = useMemo(() => {
    const map = new Map<string, string[]>();

    issues
      .filter((issue) => issue.stepId && issue.field !== "branch")
      .forEach((issue) => {
        const bucket = map.get(issue.stepId as string) ?? [];

        bucket.push(issue.message);
        map.set(issue.stepId as string, bucket);
      });

    return map;
  }, [issues]);

  const branchIssues = useMemo(() => {
    const map = new Map<string, string[]>();

    issues
      .filter((issue) => issue.stepId && issue.branchId)
      .forEach((issue) => {
        const key = `${issue.stepId}:${issue.branchId}`;
        const bucket = map.get(key) ?? [];

        bucket.push(issue.message);
        map.set(key, bucket);
      });

    return map;
  }, [issues]);

  function updateCurrentDocument(updater: SetStateAction<FlowchartDocument>) {
    setDocument(updater);
  }

  function handleResetSample() {
    const nextDocument = createSampleFlowchartDocument();

    setDocument(nextDocument);
    setSelectedStepId(nextDocument.steps[0]?.id);
    setExportStatus("");
    recordFlowchartDebugEvent("sample.reset", nextDocument, debugEnabled);
  }

  function handleClear() {
    const nextDocument = createEmptyFlowchartDocument();

    setDocument(nextDocument);
    setSelectedStepId(undefined);
    setExportStatus("");
    recordFlowchartDebugEvent("flowchart.clear", {}, debugEnabled);
  }

  function handleAddStep() {
    updateCurrentDocument((currentDocument) => {
      const nextSteps = addFlowchartStep(currentDocument.steps);
      const nextSelectedStepId = nextSteps[nextSteps.length - 1]?.id;

      setSelectedStepId(nextSelectedStepId);
      recordFlowchartDebugEvent(
        "step.add",
        { stepId: nextSelectedStepId },
        debugEnabled,
      );

      return {
        ...currentDocument,
        steps: nextSteps,
      };
    });
  }

  function handleRemoveStep(stepId: string) {
    updateCurrentDocument((currentDocument) => {
      const nextSteps = removeFlowchartStep(currentDocument.steps, stepId);

      setSelectedStepId(nextSteps[0]?.id);
      recordFlowchartDebugEvent("step.remove", { stepId }, debugEnabled);

      return {
        ...currentDocument,
        steps: nextSteps,
      };
    });
  }

  function handleAddBranch(stepId: string) {
    updateCurrentDocument((currentDocument) => {
      const nextSteps = addFlowchartBranch(currentDocument.steps, stepId);

      recordFlowchartDebugEvent("branch.add", { stepId }, debugEnabled);

      return {
        ...currentDocument,
        steps: nextSteps,
      };
    });
  }

  async function handleExportImage() {
    if (!previewRef.current || !canExport) {
      return;
    }

    setExportStatus("플로우차트 이미지를 준비하고 있습니다.");

    try {
      const dataUrl = await exportFlowchartPreviewImage(previewRef.current);

      downloadDataUrl(dataUrl, createDatedPngFileName("dataviz-studio-flowchart"));
      setExportStatus("플로우차트 이미지를 내보냈습니다.");
      recordFlowchartDebugEvent(
        "flowchart.export",
        {
          stepCount: document.steps.length,
          connectionCount,
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
    <section className="diagram-editor-shell" aria-label="플로우차트 편집기">
      <div className="action-bar" aria-label="플로우차트 도구 모음">
        <button type="button" onClick={handleResetSample}>
          예시 불러오기
        </button>
        <button type="button" onClick={handleClear}>
          전체 초기화
        </button>
        <button disabled={!canExport} type="button" onClick={handleExportImage}>
          PNG로 내보내기
        </button>
      </div>

      <div className="diagram-layout">
        <section
          className="diagram-edit-panel"
          aria-labelledby="flowchart-editor-title"
        >
          <div className="panel-kicker">입력</div>
          <h2 id="flowchart-editor-title">플로우차트 구성</h2>
          <p>
            단계 종류와 연결 방향을 먼저 정의하고, 조건 분기는 결정 노드에서만
            설정합니다. 표준 플로우차트 규칙에 맞게 시작, 처리, 결정, 문서, 데이터,
            서브프로세스, 종료를 조합할 수 있습니다.
          </p>
          <div className="empty-state flowchart-warning-summary" role="note">
            단계마다 입력값과 출력값을 함께 적으면 preview와 PNG에 업무 흐름의
            전후 관계가 더 명확하게 남습니다.
          </div>

          <div className="diagram-meta-grid flowchart-meta-grid">
            <label>
              <span>차트 이름</span>
              <input
                aria-label="플로우차트 이름"
                value={document.title}
                onChange={(event) =>
                  updateCurrentDocument((currentDocument) => ({
                    ...currentDocument,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>방향</span>
              <select
                aria-label="플로우차트 방향"
                value={document.direction}
                onChange={(event) =>
                  updateCurrentDocument((currentDocument) => ({
                    ...currentDocument,
                    direction: event.target.value as FlowchartDocument["direction"],
                  }))
                }
              >
                {flowchartDirectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flowchart-toggle-row">
            <input
              checked={document.laneMode}
              type="checkbox"
              onChange={(event) =>
                updateCurrentDocument((currentDocument) => ({
                  ...currentDocument,
                  laneMode: event.target.checked,
                }))
              }
            />
            <span>레인 정보 함께 입력</span>
          </label>

          {blockingIssues.length > 0 ? (
            <div className="validation-summary" role="alert">
              {blockingIssues.length}개의 오류가 있습니다. 시작 단계, 종료 단계,
              결정 분기 수, 도달 가능성을 먼저 확인해 주세요.
            </div>
          ) : null}

          {warningIssues.length > 0 ? (
            <div className="empty-state flowchart-warning-summary" role="status">
              {warningIssues.map((issue) => issue.message).join(" ")}
            </div>
          ) : null}

          <div className="diagram-section-heading">
            <h3>단계</h3>
            <button className="primary-action" type="button" onClick={handleAddStep}>
              단계 추가
            </button>
          </div>

          {document.steps.length === 0 ? (
            <div className="empty-state">
              단계를 추가하면 시작부터 종료까지의 플로우를 직접 구성할 수 있습니다.
            </div>
          ) : (
            <div className="diagram-item-list" aria-label="플로우차트 단계 목록">
              {document.steps.map((step) => {
                const isDecision = step.type === "decision";
                const isEnd = step.type === "end";
                const branchKeyPrefix = `${step.id}:`;

                return (
                  <div
                    aria-selected={selectedStepId === step.id}
                    className={
                      selectedStepId === step.id
                        ? "diagram-item-card selected"
                        : "diagram-item-card"
                    }
                    key={step.id}
                    onClick={() => setSelectedStepId(step.id)}
                  >
                    <div className="diagram-item-grid">
                      <label>
                        <span>{getFlowchartStepLabel(step.type)}</span>
                        <input
                          aria-label={`${step.label || "단계"} 단계명`}
                          placeholder={getFlowchartStepLabelPlaceholder(step.type)}
                          value={step.label}
                          onChange={(event) =>
                            updateCurrentDocument((currentDocument) => ({
                              ...currentDocument,
                              steps: updateFlowchartStep(
                                currentDocument.steps,
                                step.id,
                                {
                                  label: event.target.value,
                                },
                              ),
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>단계 유형</span>
                        <select
                          aria-label={`${step.label || "단계"} 단계 유형`}
                          value={step.type}
                          onChange={(event) =>
                            updateCurrentDocument((currentDocument) => ({
                              ...currentDocument,
                              steps: updateFlowchartStep(
                                currentDocument.steps,
                                step.id,
                                {
                                  type: event.target.value as FlowchartNodeType,
                                },
                              ),
                            }))
                          }
                        >
                          {flowchartNodeTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {document.laneMode ? (
                        <label>
                          <span>레인</span>
                          <input
                            aria-label={`${step.label || "단계"} 레인`}
                            value={step.lane ?? ""}
                            onChange={(event) =>
                              updateCurrentDocument((currentDocument) => ({
                                ...currentDocument,
                                steps: updateFlowchartStep(
                                  currentDocument.steps,
                                  step.id,
                                  {
                                    lane: event.target.value,
                                  },
                                ),
                              }))
                            }
                          />
                        </label>
                      ) : null}

                      <label>
                        <span>담당</span>
                        <input
                          aria-label={`${step.label || "단계"} 담당`}
                          placeholder="예: 운영 / 기획 / 결재 시스템"
                          value={step.owner ?? ""}
                          onChange={(event) =>
                            updateCurrentDocument((currentDocument) => ({
                              ...currentDocument,
                              steps: updateFlowchartStep(
                                currentDocument.steps,
                                step.id,
                                {
                                  owner: event.target.value,
                                },
                              ),
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>{getFlowchartInputLabel(step.type)}</span>
                        <input
                          aria-label={`${step.label || "단계"} 입력값`}
                          placeholder="예: 요청서 / 승인 요청 / 원본 데이터"
                          value={step.input ?? ""}
                          onChange={(event) =>
                            updateCurrentDocument((currentDocument) => ({
                              ...currentDocument,
                              steps: updateFlowchartStep(
                                currentDocument.steps,
                                step.id,
                                {
                                  input: event.target.value,
                                },
                              ),
                            }))
                          }
                        />
                      </label>

                      <label>
                        <span>{getFlowchartOutputLabel(step.type)}</span>
                        <input
                          aria-label={`${step.label || "단계"} 출력값`}
                          placeholder="예: 검토 완료 / 승인 여부 / 결과 문서"
                          value={step.output ?? ""}
                          onChange={(event) =>
                            updateCurrentDocument((currentDocument) => ({
                              ...currentDocument,
                              steps: updateFlowchartStep(
                                currentDocument.steps,
                                step.id,
                                {
                                  output: event.target.value,
                                },
                              ),
                            }))
                          }
                        />
                      </label>

                      {!isDecision && !isEnd ? (
                        <label>
                          <span>다음 단계</span>
                          <select
                            aria-label={`${step.label || "단계"} 다음 단계`}
                            value={step.nextStepId ?? ""}
                            onChange={(event) =>
                              updateCurrentDocument((currentDocument) => ({
                                ...currentDocument,
                                steps: updateFlowchartStep(
                                  currentDocument.steps,
                                  step.id,
                                  {
                                    nextStepId: event.target.value,
                                  },
                                ),
                              }))
                            }
                          >
                            <option value="">선택</option>
                            {getFlowchartStepOptions(document.steps, step.id).map(
                              (option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      ) : null}

                      <label className="wide-field">
                        <span>{getFlowchartNotesLabel(step.type)}</span>
                        <textarea
                          aria-label={`${step.label || "단계"} 설명`}
                          placeholder={
                            step.type === "decision"
                              ? "예: 승인 기준을 충족하면 예, 아니면 아니오로 분기"
                              : "예: 이 단계에서 무엇을 확인하거나 처리하는지"
                          }
                          value={step.notes ?? ""}
                          onChange={(event) =>
                            updateCurrentDocument((currentDocument) => ({
                              ...currentDocument,
                              steps: updateFlowchartStep(
                                currentDocument.steps,
                                step.id,
                                {
                                  notes: event.target.value,
                                },
                              ),
                            }))
                          }
                        />
                      </label>
                    </div>

                    {isDecision ? (
                      <div className="flowchart-branch-section">
                        <div className="diagram-section-heading flowchart-branch-heading">
                          <h3>분기</h3>
                          <button
                            className="primary-action"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleAddBranch(step.id);
                            }}
                          >
                            분기 추가
                          </button>
                        </div>

                        <div className="flowchart-branch-list">
                          {step.branches.map((branch) => (
                            <div className="flowchart-branch-card" key={branch.id}>
                              <div className="flowchart-branch-grid">
                                <label>
                                  <span>분기 라벨</span>
                                  <input
                                    aria-label={`${step.label || "결정 단계"} 분기 라벨`}
                                    placeholder="예 / 아니오 / 승인 / 반려"
                                    value={branch.label}
                                    onChange={(event) =>
                                      updateCurrentDocument((currentDocument) => ({
                                        ...currentDocument,
                                        steps: updateFlowchartBranch(
                                          currentDocument.steps,
                                          step.id,
                                          branch.id,
                                          {
                                            label: event.target.value,
                                          },
                                        ),
                                      }))
                                    }
                                  />
                                </label>

                                <label>
                                  <span>대상 단계</span>
                                  <select
                                    aria-label={`${step.label || "결정 단계"} 분기 대상 단계`}
                                    value={branch.targetStepId}
                                    onChange={(event) =>
                                      updateCurrentDocument((currentDocument) => ({
                                        ...currentDocument,
                                        steps: updateFlowchartBranch(
                                          currentDocument.steps,
                                          step.id,
                                          branch.id,
                                          {
                                            targetStepId: event.target.value,
                                          },
                                        ),
                                      }))
                                    }
                                  >
                                    <option value="">선택</option>
                                    {getFlowchartStepOptions(
                                      document.steps,
                                      step.id,
                                    ).map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateCurrentDocument((currentDocument) => ({
                                      ...currentDocument,
                                      steps: removeFlowchartBranch(
                                        currentDocument.steps,
                                        step.id,
                                        branch.id,
                                      ),
                                    }));
                                  }}
                                >
                                  분기 삭제
                                </button>
                              </div>

                              {(branchIssues.get(
                                `${branchKeyPrefix}${branch.id}`,
                              ) ?? []).map((message) => (
                                <p
                                  className="field-error"
                                  key={`${branch.id}-${message}`}
                                  role="alert"
                                >
                                  {message}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="diagram-item-footer">
                      <span className="diagram-item-chip">
                        {
                          flowchartNodeTypeOptions.find(
                            (option) => option.value === step.type,
                          )?.label
                        }
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveStep(step.id);
                        }}
                      >
                        단계 삭제
                      </button>
                    </div>

                    {(stepIssues.get(step.id) ?? []).map((message) => (
                      <p className="field-error" key={`${step.id}-${message}`} role="alert">
                        {message}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="diagram-preview-panel"
          aria-labelledby="flowchart-preview-title"
        >
          <div className="panel-kicker">미리보기</div>
          <h2 id="flowchart-preview-title">실시간 플로우차트</h2>
          <p>
            표준 기호와 분기 라벨이 반영된 결과를 바로 확인하고, 같은 화면에서 PNG로
            내보낼 수 있습니다.
          </p>

          <div className="diagram-preview-surface" ref={previewRef}>
            <FlowchartPreview
              document={document}
              selectedStepId={selectedStepId}
              onSelectStep={setSelectedStepId}
            />
          </div>

          <div className="preview-meta" aria-live="polite">
            <span>{document.steps.length}개 단계</span>
            <span>{connectionCount}개 연결</span>
            <span>
              {
                flowchartDirectionOptions.find(
                  (option) => option.value === document.direction,
                )?.label
              }
            </span>
          </div>

          {exportStatus ? <p className="export-status">{exportStatus}</p> : null}
        </section>
      </div>
    </section>
  );
}
