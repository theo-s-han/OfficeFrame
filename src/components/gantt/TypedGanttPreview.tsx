"use client";

import { useMemo } from "react";
import { MermaidAdapterPreview } from "./MermaidAdapterPreview";
import { WbsTreePreview } from "./WbsTreePreview";
import { createMilestoneMermaidTimeline } from "@/lib/gantt/rendererAdapters";
import type {
  GanttChartType,
  GanttTask,
  WbsStructureType,
} from "@/lib/gantt/taskModel";

type TypedGanttPreviewProps = {
  chartType: Exclude<GanttChartType, "project">;
  debugEnabled: boolean;
  onSelectTask: (taskId: string) => void;
  selectedTaskId?: string;
  tasks: GanttTask[];
  wbsProjectName: string;
  wbsStructureType: WbsStructureType;
};

export function TypedGanttPreview({
  chartType,
  debugEnabled,
  onSelectTask,
  selectedTaskId,
  tasks,
  wbsProjectName,
  wbsStructureType,
}: TypedGanttPreviewProps) {
  const milestonePreview = useMemo(
    () =>
      chartType === "milestones" ? createMilestoneMermaidTimeline(tasks) : null,
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

  return (
    <WbsTreePreview
      onSelectTask={onSelectTask}
      projectName={wbsProjectName}
      selectedTaskId={selectedTaskId}
      structureType={wbsStructureType}
      tasks={tasks}
    />
  );
}
