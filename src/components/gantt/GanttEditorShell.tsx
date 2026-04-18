"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GanttChartPreview,
  type GanttChartPreviewHandle,
} from "./GanttChartPreview";
import {
  createEmptyTaskForChartType,
  ganttChartTypes,
  getGanttChartTypeConfig,
  getPreviewTasksForChartType,
  getSampleTasksForChartType,
} from "@/lib/gantt/chartTypes";
import {
  getDateUnitInputValue,
  getQuarterOptionsForRange,
  getTimelineRangeForTasks,
  isTimelineRangeValid,
  resolveDateUnitInputValue,
  snapDateToUnit,
  type QuarterOption,
} from "@/lib/gantt/dateUnits";
import {
  addGanttTask,
  applyGanttProgressChange,
  applySafeGanttDatePatch,
  createGanttDebugSnapshot,
  formatDateForInput,
  ganttBackgroundTemplateOptions,
  ganttTaskColorOptions,
  ganttTaskStatusOptions,
  getValidPreviewTasks,
  isValidDateObject,
  removeGanttTask,
  updateGanttTask,
  validateGanttTasks,
  type GanttChartType,
  type GanttEditorShellState,
  type GanttTask,
  type GanttTaskField,
  type GanttViewMode,
} from "@/lib/gantt/taskModel";
import {
  createGanttDebugPayload,
  readGanttDebugEnabled,
  recordGanttDebugEvent,
} from "@/lib/gantt/debug";

const viewModes: Array<{ label: string; viewMode: GanttViewMode }> = [
  { label: "1일 단위", viewMode: "Day" },
  { label: "주 단위", viewMode: "Week" },
  { label: "월 단위", viewMode: "Month" },
  { label: "분기 단위", viewMode: "Quarter" },
];
const initialChartType: GanttChartType = "project";
const initialTasks = getSampleTasksForChartType(initialChartType);
const initialViewMode =
  getGanttChartTypeConfig(initialChartType).defaultViewMode;
const initialTimelineRange = getTimelineRangeForTasks(
  initialTasks,
  initialViewMode,
);

function getFieldIssue(
  issues: ReturnType<typeof validateGanttTasks>,
  taskId: string,
  field: GanttTaskField,
): string | undefined {
  return issues.find(
    (issue) => issue.taskId === taskId && issue.field === field,
  )?.message;
}

function DateUnitInput({
  ariaLabel,
  boundary,
  quarterOptions,
  value,
  viewMode,
  onChange,
}: {
  ariaLabel: string;
  boundary: "start" | "end";
  quarterOptions: QuarterOption[];
  value: string;
  viewMode: GanttViewMode;
  onChange: (value: string) => void;
}) {
  const unitValue = getDateUnitInputValue(value, viewMode);

  if (viewMode === "Quarter") {
    return (
      <select
        aria-label={ariaLabel}
        value={unitValue}
        onChange={(event) =>
          onChange(
            resolveDateUnitInputValue(event.target.value, viewMode, boundary),
          )
        }
      >
        {quarterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      aria-label={ariaLabel}
      type={
        viewMode === "Week" ? "week" : viewMode === "Month" ? "month" : "date"
      }
      value={unitValue}
      onChange={(event) =>
        onChange(
          resolveDateUnitInputValue(event.target.value, viewMode, boundary),
        )
      }
    />
  );
}

export function GanttEditorShell() {
  const [state, setState] = useState<GanttEditorShellState>({
    tasks: initialTasks,
    chartType: initialChartType,
    viewMode: initialViewMode,
    timelineStart: initialTimelineRange.start,
    timelineEnd: initialTimelineRange.end,
    backgroundTemplate: "clean",
    selectedTaskId: initialTasks[0]?.id,
  });
  const [debugEnabled] = useState(() => readGanttDebugEnabled());
  const [exportStatus, setExportStatus] = useState<string>("");
  const previewRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<GanttChartPreviewHandle>(null);
  const taskRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const issues = useMemo(() => validateGanttTasks(state.tasks), [state.tasks]);
  const chartTypeConfig = getGanttChartTypeConfig(state.chartType);
  const validTasks = useMemo(
    () => getValidPreviewTasks(state.tasks),
    [state.tasks],
  );
  const previewTasks = useMemo(
    () => getPreviewTasksForChartType(validTasks, state.chartType),
    [state.chartType, validTasks],
  );
  const quarterOptions = useMemo(
    () =>
      getQuarterOptionsForRange(
        {
          start: state.timelineStart,
          end: state.timelineEnd,
        },
        state.tasks,
      ),
    [state.tasks, state.timelineEnd, state.timelineStart],
  );
  const snapshot = useMemo(() => createGanttDebugSnapshot(state), [state]);
  const timelineIssue = isTimelineRangeValid({
    start: state.timelineStart,
    end: state.timelineEnd,
  })
    ? ""
    : "표시 범위의 시작은 종료보다 빠르거나 같아야 합니다.";
  const hasIssues = issues.length > 0;
  const canExport = previewTasks.length > 0 && !hasIssues && !timelineIssue;

  useEffect(() => {
    recordGanttDebugEvent(
      debugEnabled,
      "state.snapshot",
      createGanttDebugPayload(snapshot),
    );
  }, [debugEnabled, snapshot]);

  function updateState(nextState: GanttEditorShellState, reason: string) {
    setState(nextState);
    recordGanttDebugEvent(
      debugEnabled,
      reason,
      createGanttDebugPayload(createGanttDebugSnapshot(nextState)),
    );
  }

  function setTaskRowRef(taskId: string, element: HTMLDivElement | null) {
    if (element) {
      taskRowRefs.current.set(taskId, element);
      return;
    }

    taskRowRefs.current.delete(taskId);
  }

  function focusTaskEditor(taskId: string) {
    window.requestAnimationFrame(() => {
      const row = taskRowRefs.current.get(taskId);

      if (!row) {
        return;
      }

      row.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      row.querySelector<HTMLElement>("input, select")?.focus({
        preventScroll: true,
      });
    });
  }

  function handleTaskChange(
    taskId: string,
    field: keyof GanttTask,
    value: GanttTask[keyof GanttTask],
  ) {
    const patch = {
      [field]: value,
    } as Partial<GanttTask>;

    if (state.chartType === "milestones" && field === "start") {
      patch.end = String(value);
    }

    const nextTasks = updateGanttTask(state.tasks, taskId, patch);

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: taskId,
      },
      `task.${field}.change`,
    );
  }

  function handleDependenciesChange(taskId: string, value: string) {
    const dependencies = value
      .split(",")
      .map((dependency) => dependency.trim())
      .filter((dependency) => dependency.length > 0 && dependency !== taskId);

    handleTaskChange(
      taskId,
      "dependencies",
      dependencies.length > 0 ? dependencies : undefined,
    );
  }

  function handleTaskDateChange(
    taskId: string,
    field: "start" | "end",
    value: string,
  ) {
    const patch = {
      [field]: value,
    } as Partial<GanttTask>;

    if (state.chartType === "milestones" && field === "start") {
      patch.end = value;
    }

    const nextTasks = updateGanttTask(state.tasks, taskId, patch);

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: taskId,
      },
      `task.${field}.change`,
    );
  }

  function handleAddTask() {
    const nextTasks = addGanttTask(
      state.tasks,
      createEmptyTaskForChartType(
        state.tasks,
        state.chartType,
        state.timelineStart,
      ),
    );
    const addedTask = nextTasks[nextTasks.length - 1];

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: addedTask?.id,
      },
      "task.add",
    );
  }

  function handleRemoveTask(taskId: string) {
    const nextTasks = removeGanttTask(state.tasks, taskId);

    updateState(
      {
        ...state,
        tasks: nextTasks,
        selectedTaskId: nextTasks[0]?.id,
      },
      "task.remove",
    );
  }

  function handleResetSample() {
    const nextTasks = getSampleTasksForChartType(state.chartType);
    const nextTimelineRange = getTimelineRangeForTasks(
      nextTasks,
      chartTypeConfig.defaultViewMode,
    );

    updateState(
      {
        ...state,
        tasks: nextTasks,
        viewMode: chartTypeConfig.defaultViewMode,
        timelineStart: nextTimelineRange.start,
        timelineEnd: nextTimelineRange.end,
        backgroundTemplate: state.backgroundTemplate,
        selectedTaskId: nextTasks[0]?.id,
      },
      "tasks.reset_sample",
    );
    setExportStatus("");
  }

  function handleClearTasks() {
    updateState(
      {
        ...state,
        tasks: [],
        selectedTaskId: undefined,
      },
      "tasks.clear",
    );
    setExportStatus("");
  }

  function handleViewModeChange(viewMode: GanttViewMode) {
    updateState(
      {
        ...state,
        viewMode,
        timelineStart: snapDateToUnit(state.timelineStart, viewMode, "start"),
        timelineEnd: snapDateToUnit(state.timelineEnd, viewMode, "end"),
      },
      "view_mode.change",
    );
  }

  function handleTimelineRangeChange(
    field: "timelineStart" | "timelineEnd",
    value: string,
  ) {
    updateState(
      {
        ...state,
        [field]: value,
      },
      `timeline.${field}.change`,
    );
  }

  function handleChartTypeChange(chartType: GanttChartType) {
    const config = getGanttChartTypeConfig(chartType);
    const nextTasks = getSampleTasksForChartType(chartType);
    const nextTimelineRange = getTimelineRangeForTasks(
      nextTasks,
      config.defaultViewMode,
    );

    updateState(
      {
        tasks: nextTasks,
        chartType,
        viewMode: config.defaultViewMode,
        timelineStart: nextTimelineRange.start,
        timelineEnd: nextTimelineRange.end,
        backgroundTemplate: state.backgroundTemplate,
        selectedTaskId: nextTasks[0]?.id,
      },
      "chart_type.change",
    );
    setExportStatus("");
  }

  function handleDateChange(taskId: string, start: Date, end: Date) {
    if (!isValidDateObject(start) || !isValidDateObject(end)) {
      recordGanttDebugEvent(debugEnabled, "chart.date_change.reverted", {
        taskId,
        reason: "invalid_date_object",
        start: String(start),
        end: String(end),
      });
      handlePreviewTaskSelect(taskId);
      return;
    }

    const nextStart = snapDateToUnit(
      formatDateForInput(start),
      state.viewMode,
      "start",
    );
    const nextEnd =
      state.chartType === "milestones"
        ? nextStart
        : snapDateToUnit(formatDateForInput(end), state.viewMode, "end");
    const patchResult = applySafeGanttDatePatch(
      state.tasks,
      taskId,
      nextStart,
      nextEnd,
    );

    if (!patchResult.applied) {
      recordGanttDebugEvent(debugEnabled, "chart.date_change.reverted", {
        taskId,
        reason: patchResult.reason,
        start: nextStart,
        end: nextEnd,
      });
      handlePreviewTaskSelect(taskId);
      return;
    }

    updateState(
      {
        ...state,
        tasks: patchResult.tasks,
        selectedTaskId: taskId,
      },
      "chart.date_change",
    );
  }

  function handleProgressChange(taskId: string, progress: number) {
    updateState(
      {
        ...state,
        tasks: applyGanttProgressChange(state.tasks, taskId, progress),
        selectedTaskId: taskId,
      },
      "chart.progress_change",
    );
  }

  function handleBackgroundTemplateChange(value: string) {
    updateState(
      {
        ...state,
        backgroundTemplate:
          ganttBackgroundTemplateOptions.find(
            (option) => option.value === value,
          )?.value ?? "clean",
      },
      "background_template.change",
    );
  }

  function handlePreviewTaskSelect(taskId: string) {
    setState((current) => {
      if (current.selectedTaskId === taskId) {
        recordGanttDebugEvent(debugEnabled, "chart.select_task_for_edit.skip", {
          selectedTaskId: taskId,
        });
        return current;
      }

      const nextState = {
        ...current,
        selectedTaskId: taskId,
      };

      recordGanttDebugEvent(
        debugEnabled,
        "chart.select_task_for_edit",
        createGanttDebugPayload(createGanttDebugSnapshot(nextState)),
      );

      return nextState;
    });
    focusTaskEditor(taskId);
  }

  async function handleExportPng() {
    if (!previewRef.current || !canExport) {
      return;
    }

    setExportStatus("PNG를 준비하고 있습니다.");
    recordGanttDebugEvent(debugEnabled, "export.start", {
      taskCount: previewTasks.length,
    });

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(previewRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `office-tool-${state.chartType}-gantt.png`;
      link.href = dataUrl;
      link.click();
      setExportStatus("PNG 다운로드가 완료되었습니다.");
      recordGanttDebugEvent(debugEnabled, "export.success", {
        byteLength: dataUrl.length,
      });
    } catch (error) {
      setExportStatus(
        "PNG 다운로드에 실패했습니다. preview를 다시 확인하세요.",
      );
      recordGanttDebugEvent(debugEnabled, "export.error", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <section className="editor-shell" aria-label="간트 에디터">
      <div className="chart-type-selector" aria-label="간트 타입 선택">
        {ganttChartTypes.map((type) => (
          <button
            aria-pressed={state.chartType === type.id}
            className={state.chartType === type.id ? "active" : ""}
            key={type.id}
            type="button"
            onClick={() => handleChartTypeChange(type.id)}
          >
            <span>{type.name}</span>
            <small>{type.description}</small>
          </button>
        ))}
      </div>

      <div className="action-bar" aria-label="간트 toolbar">
        <button type="button" onClick={handleResetSample}>
          예시 데이터
        </button>
        <button type="button" onClick={handleClearTasks}>
          전체 초기화
        </button>
        <button type="button" onClick={() => chartRef.current?.scrollToToday()}>
          오늘로 이동
        </button>
        <button type="button" disabled={!canExport} onClick={handleExportPng}>
          PNG 다운로드
        </button>
      </div>

      <div className="timeline-control-bar" aria-label="날짜 단위와 표시 범위">
        <div className="view-mode-group" aria-label="날짜 입력 단위">
          {viewModes.map((item) => (
            <button
              aria-pressed={state.viewMode === item.viewMode}
              className={state.viewMode === item.viewMode ? "active" : ""}
              key={item.viewMode}
              type="button"
              onClick={() => handleViewModeChange(item.viewMode)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="timeline-range-controls">
          <label>
            <span>표시 시작</span>
            <DateUnitInput
              ariaLabel="표시 시작"
              boundary="start"
              quarterOptions={quarterOptions}
              value={state.timelineStart}
              viewMode={state.viewMode}
              onChange={(value) =>
                handleTimelineRangeChange("timelineStart", value)
              }
            />
          </label>
          <label>
            <span>표시 종료</span>
            <DateUnitInput
              ariaLabel="표시 종료"
              boundary="end"
              quarterOptions={quarterOptions}
              value={state.timelineEnd}
              viewMode={state.viewMode}
              onChange={(value) =>
                handleTimelineRangeChange("timelineEnd", value)
              }
            />
          </label>
        </div>
        {timelineIssue ? (
          <p className="timeline-range-error" role="alert">
            {timelineIssue}
          </p>
        ) : null}
        {state.chartType === "project" ? (
          <div className="gantt-style-controls" aria-label="기본 일정표 스타일">
            <label>
              <span>배경 템플릿</span>
              <select
                aria-label="배경 템플릿"
                value={state.backgroundTemplate}
                onChange={(event) =>
                  handleBackgroundTemplateChange(event.target.value)
                }
              >
                {ganttBackgroundTemplateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </div>

      <div className="editor-layout">
        <section
          className="preview-panel"
          aria-labelledby="gantt-preview-panel"
        >
          <div className="panel-kicker">미리보기</div>
          <h2 id="gantt-preview-panel">{chartTypeConfig.previewTitle}</h2>
          <p>{chartTypeConfig.previewHelp}</p>

          {hasIssues ? (
            <div className="validation-summary" role="alert">
              {issues.length}개의 입력 오류가 있어 유효한 작업만 preview에
              반영됩니다.
            </div>
          ) : null}

          <div
            className={`gantt-export-surface gantt-type-${state.chartType} gantt-background-${state.backgroundTemplate}`}
            ref={previewRef}
          >
            <GanttChartPreview
              chartType={state.chartType}
              debugEnabled={debugEnabled}
              ref={chartRef}
              tasks={previewTasks}
              timelineEnd={state.timelineEnd}
              timelineStart={state.timelineStart}
              viewMode={state.viewMode}
              onDateChange={handleDateChange}
              onProgressChange={handleProgressChange}
              onSelectTask={handlePreviewTaskSelect}
            />
          </div>

          <div className="preview-meta" aria-live="polite">
            <span>{previewTasks.length}개 작업 preview</span>
            <span>{chartTypeConfig.shortName}</span>
            <span>{state.viewMode} 단위</span>
            <span>
              {state.timelineStart} - {state.timelineEnd}
            </span>
          </div>
          {exportStatus ? (
            <p className="export-status">{exportStatus}</p>
          ) : null}
        </section>

        <section className="edit-panel" aria-labelledby="gantt-editor-panel">
          <div className="edit-panel-heading">
            <div>
              <div className="panel-kicker">일정 입력</div>
              <h2 id="gantt-editor-panel">{chartTypeConfig.editorTitle}</h2>
              <p>{chartTypeConfig.editorHelp}</p>
            </div>
            <button
              className="add-task-button"
              type="button"
              onClick={handleAddTask}
            >
              작업 추가
            </button>
          </div>

          {state.tasks.length === 0 ? (
            <div className="empty-state">
              작업을 추가하면 preview가 표시됩니다.
            </div>
          ) : (
            <div className="task-editor-list" aria-label="간트 작업 목록">
              {state.tasks.map((task) => (
                <div
                  className={
                    state.selectedTaskId === task.id
                      ? `task-editor-row type-${state.chartType} selected`
                      : `task-editor-row type-${state.chartType}`
                  }
                  key={task.id}
                  ref={(element) => setTaskRowRef(task.id, element)}
                  aria-selected={state.selectedTaskId === task.id}
                >
                  {chartTypeConfig.fields.phase ? (
                    <label>
                      <span>{chartTypeConfig.phaseLabel}</span>
                      <input
                        aria-label={`${task.name} ${chartTypeConfig.phaseLabel}`}
                        value={task.phase ?? ""}
                        onChange={(event) =>
                          handleTaskChange(task.id, "phase", event.target.value)
                        }
                      />
                    </label>
                  ) : null}
                  <label>
                    <span>{chartTypeConfig.taskNameLabel}</span>
                    <input
                      aria-label={`${task.name} 작업명`}
                      value={task.name}
                      onChange={(event) =>
                        handleTaskChange(task.id, "name", event.target.value)
                      }
                    />
                  </label>
                  {chartTypeConfig.fields.owner ? (
                    <label>
                      <span>{chartTypeConfig.ownerLabel}</span>
                      <input
                        aria-label={`${task.name} 담당자`}
                        value={task.owner ?? ""}
                        onChange={(event) =>
                          handleTaskChange(task.id, "owner", event.target.value)
                        }
                      />
                    </label>
                  ) : null}
                  {state.chartType === "project" ? (
                    <label>
                      <span>색상</span>
                      <select
                        aria-label={`${task.name} 색상`}
                        value={task.color ?? "emerald"}
                        onChange={(event) =>
                          handleTaskChange(task.id, "color", event.target.value)
                        }
                      >
                        {ganttTaskColorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {chartTypeConfig.fields.status ? (
                    <label>
                      <span>{chartTypeConfig.statusLabel}</span>
                      <select
                        aria-label={`${task.name} 상태`}
                        value={task.status ?? "planned"}
                        onChange={(event) =>
                          handleTaskChange(
                            task.id,
                            "status",
                            event.target.value,
                          )
                        }
                      >
                        {ganttTaskStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label>
                    <span>{chartTypeConfig.startLabel}</span>
                    <DateUnitInput
                      ariaLabel={`${task.name} 시작`}
                      boundary="start"
                      quarterOptions={quarterOptions}
                      value={task.start}
                      viewMode={state.viewMode}
                      onChange={(value) =>
                        handleTaskDateChange(task.id, "start", value)
                      }
                    />
                  </label>
                  {chartTypeConfig.fields.end ? (
                    <label>
                      <span>{chartTypeConfig.endLabel}</span>
                      <DateUnitInput
                        ariaLabel={`${task.name} 종료`}
                        boundary="end"
                        quarterOptions={quarterOptions}
                        value={task.end}
                        viewMode={state.viewMode}
                        onChange={(value) =>
                          handleTaskDateChange(task.id, "end", value)
                        }
                      />
                    </label>
                  ) : null}
                  {chartTypeConfig.fields.progress ? (
                    <label>
                      <span>{chartTypeConfig.progressLabel}</span>
                      <input
                        aria-label={`${task.name} 진행률`}
                        max={100}
                        min={0}
                        type="number"
                        value={task.progress}
                        onChange={(event) =>
                          handleTaskChange(
                            task.id,
                            "progress",
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  ) : null}
                  {chartTypeConfig.fields.baseline ? (
                    <>
                      <label>
                        <span>{chartTypeConfig.baselineStartLabel}</span>
                        <DateUnitInput
                          ariaLabel={`${task.name} 계획 시작`}
                          boundary="start"
                          quarterOptions={quarterOptions}
                          value={task.baselineStart ?? task.start}
                          viewMode={state.viewMode}
                          onChange={(value) =>
                            handleTaskChange(task.id, "baselineStart", value)
                          }
                        />
                      </label>
                      <label>
                        <span>{chartTypeConfig.baselineEndLabel}</span>
                        <DateUnitInput
                          ariaLabel={`${task.name} 계획 종료`}
                          boundary="end"
                          quarterOptions={quarterOptions}
                          value={task.baselineEnd ?? task.end}
                          viewMode={state.viewMode}
                          onChange={(value) =>
                            handleTaskChange(task.id, "baselineEnd", value)
                          }
                        />
                      </label>
                    </>
                  ) : null}
                  {chartTypeConfig.fields.dependencies ? (
                    <label>
                      <span>{chartTypeConfig.dependenciesLabel}</span>
                      <input
                        aria-label={`${task.name} 선행 작업`}
                        placeholder="wbs-1, wbs-2"
                        value={(task.dependencies ?? []).join(", ")}
                        onChange={(event) =>
                          handleDependenciesChange(task.id, event.target.value)
                        }
                      />
                    </label>
                  ) : null}
                  <button
                    className="remove-task-button"
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                  >
                    삭제
                  </button>
                  {(
                    [
                      "phase",
                      "name",
                      "start",
                      "end",
                      "progress",
                      "owner",
                      "status",
                      "baselineStart",
                      "baselineEnd",
                      "color",
                      "dependencies",
                    ] as GanttTaskField[]
                  ).map((field) => {
                    const message = getFieldIssue(issues, task.id, field);

                    return message ? (
                      <p className="field-error" key={field}>
                        {message}
                      </p>
                    ) : null;
                  })}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
