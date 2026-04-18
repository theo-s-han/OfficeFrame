"use client";

import { useMemo } from "react";
import { JsGanttAdapterPreview } from "./JsGanttAdapterPreview";
import { MermaidAdapterPreview } from "./MermaidAdapterPreview";
import {
  createMilestoneJsGanttRows,
  createMilestoneMermaidGantt,
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
  const preview = useMemo(() => {
    if (chartType === "wbs") {
      return {
        jsGantt: createWbsJsGanttRows(tasks),
        mermaid: [
          createWbsMermaidTreeView(tasks),
          createWbsMermaidMindmap(tasks),
        ],
        title: "WBS schedule renderer",
        variant: "wbs" as const,
      };
    }

    return {
      jsGantt: createMilestoneJsGanttRows(tasks),
      mermaid: [createMilestoneMermaidGantt(tasks)],
      title: "Milestone interactive renderer",
      variant: "milestones" as const,
    };
  }, [chartType, tasks]);

  return (
    <div className="typed-gantt-preview">
      <div className="adapter-preview-grid">
        <JsGanttAdapterPreview
          adapterResult={preview.jsGantt}
          debugEnabled={debugEnabled}
          title={preview.title}
          variant={preview.variant}
        />
        {preview.mermaid.map((adapterResult) => (
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
