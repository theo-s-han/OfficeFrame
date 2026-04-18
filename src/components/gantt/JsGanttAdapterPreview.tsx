"use client";

import { useEffect, useRef, useState } from "react";
import { recordGanttDebugEvent } from "@/lib/gantt/debug";
import type { JsGanttAdapterResult } from "@/lib/gantt/rendererAdapters";

type JsGanttAdapterPreviewProps = {
  adapterResult: JsGanttAdapterResult;
  debugEnabled: boolean;
  title: string;
};

export function JsGanttAdapterPreview({
  adapterResult,
  debugEnabled,
  title,
}: JsGanttAdapterPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("jsGantt preview를 준비하고 있습니다.");

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!containerRef.current) {
        return;
      }

      if (adapterResult.rows.length === 0) {
        containerRef.current.innerHTML = "";
        setStatus("입력된 항목이 없습니다.");
        return;
      }

      try {
        const jsGanttModule = await import("jsgantt-improved");
        const JSGantt = jsGanttModule.JSGantt ?? jsGanttModule.default;

        if (!isMounted || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";

        const chart = new JSGantt.GanttChart(containerRef.current, "week");

        chart.setDateInputFormat?.("yyyy-mm-dd");
        chart.setDateTaskTableDisplayFormat?.("yyyy-mm-dd");
        chart.setCaptionType?.("Caption");
        chart.setShowSelector?.("Top");
        chart.setShowRes?.(1);
        chart.setShowDur?.(1);
        chart.setShowComp?.(1);
        chart.setShowStartDate?.(1);
        chart.setShowEndDate?.(1);
        chart.setShowPlanStartDate?.(0);
        chart.setShowPlanEndDate?.(0);
        chart.setShowCost?.(0);
        chart.setUseSingleCell?.(10000);
        chart.setTotalHeight?.(
          `${Math.min(520, Math.max(360, adapterResult.rows.length * 44 + 170))}px`,
        );
        chart.setAdditionalHeaders?.(adapterResult.additionalHeaders);

        adapterResult.rows.forEach((row) => chart.AddTaskItemObject(row));
        chart.Draw();
        setStatus("");

        recordGanttDebugEvent(debugEnabled, "adapter.jsgantt.render", {
          rowCount: adapterResult.rows.length,
          title,
        });
      } catch (error) {
        setStatus("jsGantt preview를 불러오지 못했습니다.");
        recordGanttDebugEvent(debugEnabled, "adapter.jsgantt.error", {
          message: error instanceof Error ? error.message : String(error),
          title,
        });
      }
    }

    void renderChart();

    return () => {
      isMounted = false;
    };
  }, [adapterResult, debugEnabled, title]);

  return (
    <section className="adapter-preview-section adapter-wbs">
      <h3>{title}</h3>
      <div className="jsgantt-adapter-preview jsgantt-wbs" ref={containerRef} />
      {status ? <p className="gantt-preview-status">{status}</p> : null}
    </section>
  );
}
