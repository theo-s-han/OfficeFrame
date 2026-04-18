"use client";

import { useMemo } from "react";
import { JsGanttAdapterPreview } from "./JsGanttAdapterPreview";
import { MermaidAdapterPreview } from "./MermaidAdapterPreview";
import {
  createMilestoneMermaidTimeline,
  createWbsJsGanttRows,
  createWbsMermaidMindmap,
  createWbsMermaidTreeView,
} from "@/lib/gantt/rendererAdapters";
import type { GanttChartType, GanttTask } from "@/lib/gantt/taskModel";

type TypedGanttPreviewProps = {
  chartType: Exclude<GanttChartType, "project">;
  debugEnabled: boolean;
  tasks: GanttTask[];
};

export function TypedGanttPreview({
  chartType,
  debugEnabled,
  tasks,
}: TypedGanttPreviewProps) {
  const milestonePreview = useMemo(
    () =>
      chartType === "milestones" ? createMilestoneMermaidTimeline(tasks) : null,
    [chartType, tasks],
  );
  const wbsPreview = useMemo(
    () =>
      chartType === "wbs"
        ? {
            jsGantt: createWbsJsGanttRows(tasks),
            mermaid: [
              createWbsMermaidTreeView(tasks),
              createWbsMermaidMindmap(tasks),
            ],
          }
        : null,
    [chartType, tasks],
  );

  if (tasks.length === 0) {
    return (
      <div className={`typed-gantt-preview typed-gantt-${chartType}`}>
        <div className="preview-placeholder">
          <p>작업을 추가하면 preview가 표시됩니다.</p>
        </div>
      </div>
    );
  }

  if (chartType === "milestones") {
    return (
      <div className="typed-gantt-preview typed-gantt-milestones">
        <MermaidAdapterPreview
          adapterResult={milestonePreview ?? createMilestoneMermaidTimeline([])}
          debugEnabled={debugEnabled}
          showSource={false}
        />
      </div>
    );
  }

  if (!wbsPreview) {
    return null;
  }

  return (
    <div className="typed-gantt-preview typed-gantt-wbs">
      <div className="adapter-preview-grid">
        <JsGanttAdapterPreview
          adapterResult={wbsPreview.jsGantt}
          debugEnabled={debugEnabled}
          title="WBS 일정표"
        />
        {wbsPreview.mermaid.map((adapterResult) => (
          <MermaidAdapterPreview
            adapterResult={adapterResult}
            debugEnabled={debugEnabled}
            key={`${adapterResult.kind}-${adapterResult.title}`}
          />
        ))}
      </div>
    </div>
  );
}
