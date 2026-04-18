"use client";

import { useEffect, useId, useState } from "react";
import { recordGanttDebugEvent } from "@/lib/gantt/debug";
import type { MermaidAdapterResult } from "@/lib/gantt/rendererAdapters";
import { defaultGanttPalette } from "@/lib/gantt/theme";

type MermaidAdapterPreviewProps = {
  adapterResult: MermaidAdapterResult;
  debugEnabled: boolean;
  showSource?: boolean;
};

export function MermaidAdapterPreview({
  adapterResult,
  debugEnabled,
  showSource = true,
}: MermaidAdapterPreviewProps) {
  const rawId = useId();
  const renderId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [status, setStatus] = useState("미리보기를 준비하고 있습니다.");

  useEffect(() => {
    let isMounted = true;

    async function renderDiagram() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            primaryColor: defaultGanttPalette.neutral.surface,
            primaryTextColor: defaultGanttPalette.neutral.textPrimary,
            primaryBorderColor: defaultGanttPalette.taskColors[0],
            lineColor: defaultGanttPalette.neutral.dependencyLine,
            sectionBkgColor: defaultGanttPalette.neutral.background,
            altSectionBkgColor: defaultGanttPalette.neutral.surface,
            taskBkgColor: defaultGanttPalette.taskColors[0],
            taskTextColor: defaultGanttPalette.neutral.textPrimary,
            taskTextOutsideColor: defaultGanttPalette.neutral.textSecondary,
            taskBorderColor: defaultGanttPalette.taskColors[0],
            activeTaskBkgColor: defaultGanttPalette.taskColors[1],
            doneTaskBkgColor: defaultGanttPalette.semantic.success,
            critBkgColor: defaultGanttPalette.semantic.danger,
            fontFamily: "Arial, Noto Sans KR, sans-serif",
          },
        });

        const result = await mermaid.render(renderId, adapterResult.definition);

        if (!isMounted) {
          return;
        }

        setSvg(result.svg);
        setStatus("");
        recordGanttDebugEvent(debugEnabled, "adapter.mermaid.render", {
          kind: adapterResult.kind,
          title: adapterResult.title,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSvg("");
        setStatus(
          showSource
            ? "미리보기를 불러오지 못했습니다. 아래 DSL을 확인하세요."
            : "미리보기를 불러오지 못했습니다.",
        );
        recordGanttDebugEvent(debugEnabled, "adapter.mermaid.error", {
          definition: adapterResult.definition,
          kind: adapterResult.kind,
          message: error instanceof Error ? error.message : String(error),
          title: adapterResult.title,
        });
      }
    }

    void renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [adapterResult, debugEnabled, renderId, showSource]);

  return (
    <section
      className={`adapter-preview-section mermaid-kind-${adapterResult.kind}`}
    >
      <h3>{adapterResult.title}</h3>
      {svg ? (
        <div
          className="mermaid-preview"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}
      {status ? <p className="gantt-preview-status">{status}</p> : null}
      {showSource ? (
        <details className="mermaid-source">
          <summary>문서용 DSL</summary>
          <pre>{adapterResult.definition}</pre>
        </details>
      ) : null}
    </section>
  );
}
