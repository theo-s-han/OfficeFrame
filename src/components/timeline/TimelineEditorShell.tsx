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
  addTimelineItem,
  createSampleTimelineState,
  getSortedValidTimelineItems,
  getTimelineStatusLabel,
  removeTimelineItem,
  timelineStatusOptions,
  updateTimelineItem,
  validateTimelineState,
} from "@/lib/timeline/model";
import { readTimelineDebugEnabled, recordTimelineDebugEvent } from "@/lib/timeline/debug";
import { exportTimelinePreviewImage } from "@/lib/timeline/export";
import { createDatedPngFileName, downloadDataUrl } from "@/lib/shared/download";
import { TimelinePreview } from "./TimelinePreview";

const initialState = createSampleTimelineState();
const TIMELINE_PREVIEW_ZOOM_DEFAULT = 0.8;
const TIMELINE_PREVIEW_ZOOM_STEP = 0.1;
const TIMELINE_PREVIEW_ZOOM_MIN = 0.4;
const TIMELINE_PREVIEW_ZOOM_MAX = 1.4;

export function TimelineEditorShell() {
  const [title, setTitle] = useState(initialState.title);
  const [mode, setMode] = useState(initialState.mode);
  const [items, setItems] = useState(initialState.items);
  const [selectedItemId, setSelectedItemId] = useState(initialState.selectedItemId);
  const [exportStatus, setExportStatus] = useState("");
  const [colorDialogItemId, setColorDialogItemId] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState(defaultGanttTaskColor);
  const [previewZoom, setPreviewZoom] = useState(TIMELINE_PREVIEW_ZOOM_DEFAULT);
  const debugEnabled = useState(() => readTimelineDebugEnabled())[0];
  const previewRef = useRef<HTMLDivElement>(null);
  const issues = useMemo(() => validateTimelineState(items), [items]);
  const validItems = useMemo(() => getSortedValidTimelineItems(items), [items]);
  const colorDialogItem = items.find((item) => item.id === colorDialogItemId);
  const previewDraftColor = normalizeGanttTaskColor(draftColor);
  const canApplyDraftColor = isValidGanttTaskColor(previewDraftColor);
  const canExport = validItems.length > 0 && issues.length === 0;
  const issueMap = useMemo(() => {
    const map = new Map<string, string[]>();

    issues.forEach((issue) => {
      const bucket = map.get(issue.itemId) ?? [];

      bucket.push(issue.message);
      map.set(issue.itemId, bucket);
    });

    return map;
  }, [issues]);

  function adjustPreviewZoom(direction: "in" | "out") {
    setPreviewZoom((currentZoom) => {
      const nextZoom =
        direction === "in"
          ? currentZoom + TIMELINE_PREVIEW_ZOOM_STEP
          : currentZoom - TIMELINE_PREVIEW_ZOOM_STEP;

      return Number(
        Math.min(TIMELINE_PREVIEW_ZOOM_MAX, Math.max(TIMELINE_PREVIEW_ZOOM_MIN, nextZoom)).toFixed(
          1,
        ),
      );
    });
  }

  function handleResetSample() {
    const nextState = createSampleTimelineState();

    setTitle(nextState.title);
    setMode(nextState.mode);
    setItems(nextState.items);
    setSelectedItemId(nextState.selectedItemId);
    setPreviewZoom(TIMELINE_PREVIEW_ZOOM_DEFAULT);
    setExportStatus("");
    recordTimelineDebugEvent("sample.reset", nextState, debugEnabled);
  }

  function handleClear() {
    setTitle("새 타임라인");
    setMode("alternating");
    setItems([]);
    setSelectedItemId(undefined);
    setPreviewZoom(TIMELINE_PREVIEW_ZOOM_DEFAULT);
    setExportStatus("");
    recordTimelineDebugEvent("timeline.clear", {}, debugEnabled);
  }

  function handleAddItem() {
    const nextItems = addTimelineItem(items);
    const nextItemId = nextItems[nextItems.length - 1]?.id;

    setItems(nextItems);
    setSelectedItemId(nextItemId);
    recordTimelineDebugEvent("item.add", { itemId: nextItemId }, debugEnabled);
  }

  function handleRemoveItem(itemId: string) {
    const nextItems = removeTimelineItem(items, itemId);

    setItems(nextItems);
    setSelectedItemId(nextItems[0]?.id);
    recordTimelineDebugEvent("item.remove", { itemId }, debugEnabled);
  }

  function openColorPicker(itemId: string) {
    const item = items.find((candidate) => candidate.id === itemId);

    setColorDialogItemId(itemId);
    setDraftColor(item?.color ?? defaultGanttTaskColor);
  }

  function closeColorPicker() {
    setColorDialogItemId(null);
    setDraftColor(defaultGanttTaskColor);
  }

  function applyDraftColor() {
    if (!colorDialogItem || !canApplyDraftColor) {
      return;
    }

    setItems((currentItems) =>
      updateTimelineItem(currentItems, colorDialogItem.id, {
        color: previewDraftColor,
      }),
    );
    closeColorPicker();
  }

  async function handleExportImage() {
    if (!previewRef.current || !canExport) {
      return;
    }

    setExportStatus("타임라인 이미지를 준비하는 중입니다.");

    try {
      const dataUrl = await exportTimelinePreviewImage(previewRef.current);

      downloadDataUrl(dataUrl, createDatedPngFileName("office-tool-timeline"));
      setExportStatus("타임라인 이미지를 내보냈습니다.");
      recordTimelineDebugEvent(
        "timeline.export",
        {
          itemCount: validItems.length,
          mode,
        },
        debugEnabled,
      );
    } catch (error) {
      setExportStatus("이미지 내보내기에 실패했습니다.");
      recordTimelineDebugEvent(
        "timeline.export.error",
        {
          message:
            error instanceof Error ? error.message : "unknown export error",
        },
        debugEnabled,
      );
    }
  }

  return (
    <section className="diagram-editor-shell" aria-label="타임라인 에디터">
      <div className="action-bar" aria-label="타임라인 toolbar">
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
        <section className="diagram-edit-panel" aria-labelledby="timeline-editor-title">
          <div className="panel-kicker">입력</div>
          <h2 id="timeline-editor-title">타임라인 입력</h2>
          <p>날짜 중심 이벤트를 정리해 문서/PPT용 timeline preview를 바로 확인합니다.</p>

          {issues.length > 0 ? (
            <div className="validation-summary" role="alert">
              {issues.length}개의 입력 오류가 있어 정상 이벤트만 preview에 반영됩니다.
            </div>
          ) : null}

          <div className="diagram-section-heading">
            <h3>이벤트</h3>
            <button className="primary-action" type="button" onClick={handleAddItem}>
              이벤트 추가
            </button>
          </div>

          {items.length === 0 ? (
            <div className="empty-state">이벤트를 추가하면 타임라인이 표시됩니다.</div>
          ) : (
            <div className="diagram-item-list" aria-label="타임라인 이벤트 목록">
              {items.map((item) => (
                <div
                  aria-selected={selectedItemId === item.id}
                  className={
                    selectedItemId === item.id
                      ? "diagram-item-card selected"
                      : "diagram-item-card"
                  }
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <div className="diagram-item-grid">
                    <label>
                      <span>항목명</span>
                      <input
                        aria-label={`${item.name} 항목명`}
                        value={item.name}
                        onChange={(event) =>
                          setItems((currentItems) =>
                            updateTimelineItem(currentItems, item.id, {
                              name: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>날짜</span>
                      <input
                        aria-label={`${item.name} 날짜`}
                        type="date"
                        value={item.date}
                        onChange={(event) =>
                          setItems((currentItems) =>
                            updateTimelineItem(currentItems, item.id, {
                              date: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>섹션</span>
                      <input
                        aria-label={`${item.name} 섹션`}
                        value={item.section ?? ""}
                        onChange={(event) =>
                          setItems((currentItems) =>
                            updateTimelineItem(currentItems, item.id, {
                              section: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>상태</span>
                      <select
                        aria-label={`${item.name} 상태`}
                        value={item.status ?? "planned"}
                        onChange={(event) =>
                          setItems((currentItems) =>
                            updateTimelineItem(currentItems, item.id, {
                              status: event.target.value as typeof item.status,
                            }),
                          )
                        }
                      >
                        {timelineStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>담당자</span>
                      <input
                        aria-label={`${item.name} 담당자`}
                        value={item.owner ?? ""}
                        onChange={(event) =>
                          setItems((currentItems) =>
                            updateTimelineItem(currentItems, item.id, {
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
                          openColorPicker(item.id);
                        }}
                      >
                        <span
                          className="color-swatch"
                          style={{ backgroundColor: normalizeGanttTaskColor(item.color) }}
                        />
                        <span>{normalizeGanttTaskColor(item.color)}</span>
                      </button>
                    </label>
                    <label className="wide-field">
                      <span>설명</span>
                      <textarea
                        aria-label={`${item.name} 설명`}
                        value={item.notes ?? ""}
                        onChange={(event) =>
                          setItems((currentItems) =>
                            updateTimelineItem(currentItems, item.id, {
                              notes: event.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="diagram-item-footer">
                    <span className="diagram-item-chip">
                      {getTimelineStatusLabel(item.status)}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                    >
                      삭제
                    </button>
                  </div>

                  {(issueMap.get(item.id) ?? []).map((message) => (
                    <p className="field-error" key={`${item.id}-${message}`} role="alert">
                      {message}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="diagram-preview-panel" aria-labelledby="timeline-preview-title">
          <div className="panel-kicker">미리보기</div>
          <h2 id="timeline-preview-title">타임라인 preview</h2>
          <p>이벤트 흐름을 한 화면에 정리하고 문서형 카드로 바로 저장합니다.</p>

          <div className="timeline-preview-frame">
            <div className="timeline-preview-toolbar" aria-label="timeline preview zoom">
              <button
                aria-label="preview 축소"
                disabled={previewZoom <= TIMELINE_PREVIEW_ZOOM_MIN}
                type="button"
                onClick={() => adjustPreviewZoom("out")}
              >
                -
              </button>
              <output aria-live="polite">{Math.round(previewZoom * 100)}%</output>
              <button
                aria-label="preview 확대"
                disabled={previewZoom >= TIMELINE_PREVIEW_ZOOM_MAX}
                type="button"
                onClick={() => adjustPreviewZoom("in")}
              >
                +
              </button>
            </div>

            <div className="diagram-preview-surface" ref={previewRef}>
              <TimelinePreview
                state={{ title, mode, items, selectedItemId }}
                zoom={previewZoom}
                onSelectItem={setSelectedItemId}
              />
            </div>
          </div>

          <div className="preview-meta" aria-live="polite">
            <span>{validItems.length}개 이벤트</span>
          </div>
          {exportStatus ? <p className="export-status">{exportStatus}</p> : null}
        </section>
      </div>

      {colorDialogItem ? (
        <ColorPickerDialog
          canApply={canApplyDraftColor}
          currentColor={previewDraftColor}
          draftColor={draftColor}
          helpText="프리셋에서 고르거나 직접 색상과 HEX 값을 지정합니다."
          invalidMessage="#RRGGBB 형식의 색상을 입력해 주세요."
          options={ganttTaskColorOptions}
          title={`${colorDialogItem.name} 색상 선택`}
          onApply={applyDraftColor}
          onClose={closeColorPicker}
          onDraftColorChange={setDraftColor}
        />
      ) : null}
    </section>
  );
}
