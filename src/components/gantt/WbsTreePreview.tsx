"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CustomNodeElementProps, RawNodeDatum } from "react-d3-tree";
import { defaultGanttPalette } from "@/lib/gantt/theme";
import type { GanttTask, WbsStructureType } from "@/lib/gantt/taskModel";
import { buildWbsPreviewData } from "@/lib/gantt/wbsTree";

const Tree = dynamic(() => import("react-d3-tree").then((module) => module.default), {
  ssr: false,
});

type WbsTreePreviewProps = {
  projectName: string;
  selectedTaskId?: string;
  structureType: WbsStructureType;
  tasks: GanttTask[];
  onSelectTask: (taskId: string) => void;
};

const statusFillMap = {
  done: defaultGanttPalette.semantic.success,
  "in-progress": defaultGanttPalette.taskColors[1],
  "not-started": defaultGanttPalette.neutral.secondaryBar,
} as const;

function splitLines(value: string, maxLength: number, maxLines: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxLength) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  return [
    ...lines.slice(0, maxLines - 1),
    `${lines[maxLines - 1].slice(0, Math.max(0, maxLength - 1))}…`,
  ];
}

export function WbsTreePreview({
  projectName,
  selectedTaskId,
  structureType,
  tasks,
  onSelectTask,
}: WbsTreePreviewProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [surfaceSize, setSurfaceSize] = useState({
    height: 560,
    width: 1200,
  });
  const treeData = useMemo(
    () => buildWbsPreviewData(tasks, projectName, structureType),
    [projectName, structureType, tasks],
  );

  useEffect(() => {
    const element = surfaceRef.current;

    if (!element) {
      return;
    }

    const updateSurfaceSize = () => {
      const rect = element.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      setSurfaceSize({
        height: Math.max(520, Math.round(rect.height)),
        width: Math.max(720, Math.round(rect.width)),
      });
    };

    updateSurfaceSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSurfaceSize);

      return () => {
        window.removeEventListener("resize", updateSurfaceSize);
      };
    }

    const observer = new ResizeObserver(() => updateSurfaceSize());

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const renderCustomNodeElement = useCallback(
    ({ nodeDatum }: CustomNodeElementProps) => {
      const attributes = nodeDatum.attributes ?? {};
      const sourceId = String(attributes.sourceId ?? "");
      const kind = String(attributes.kind ?? "");
      const notes = String(attributes.notes ?? "");
      const statusKey = String(attributes.status ?? "not-started") as keyof typeof statusFillMap;
      const isRoot = kind === "project";
      const isSelected = Boolean(sourceId) && sourceId === selectedTaskId;
      const cardWidth = isRoot ? 280 : 248;
      const cardHeight = isRoot ? 112 : 122;
      const cardX = -cardWidth / 2;
      const cardY = -cardHeight / 2;
      const titleLines = splitLines(nodeDatum.name, isRoot ? 24 : 22, isRoot ? 2 : 2);
      const noteLines = splitLines(notes, 28, 2);
      const statusFill =
        statusFillMap[statusKey] ??
        defaultGanttPalette.neutral.secondaryBar;

      return (
        <g
          className={`wbs-tree-node${isRoot ? " is-root" : ""}${isSelected ? " is-selected" : ""}`}
          onClick={() => {
            if (sourceId) {
              onSelectTask(sourceId);
            }
          }}
          role={sourceId ? "button" : undefined}
          tabIndex={sourceId ? 0 : undefined}
          onKeyDown={(event) => {
            if (!sourceId) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectTask(sourceId);
            }
          }}
        >
          <rect
            className="wbs-tree-node-shadow"
            fill="rgba(15, 23, 42, 0.06)"
            height={cardHeight}
            rx={8}
            width={cardWidth}
            x={cardX + 3}
            y={cardY + 4}
          />
          <rect
            className="wbs-tree-node-card"
            fill={defaultGanttPalette.neutral.background}
            height={cardHeight}
            rx={8}
            stroke={isSelected ? defaultGanttPalette.taskColors[0] : defaultGanttPalette.neutral.rowDivider}
            strokeWidth={isSelected ? 2 : 1}
            width={cardWidth}
            x={cardX}
            y={cardY}
          />
          <rect
              fill={
                isRoot
                  ? defaultGanttPalette.taskColors[0]
                  : kind === "work-package"
                    ? defaultGanttPalette.neutral.surface
                    : defaultGanttPalette.taskColors[1]
              }
            height={8}
            rx={8}
            width={cardWidth}
            x={cardX}
            y={cardY}
          />
          <text
            className="wbs-tree-node-meta"
            fill={defaultGanttPalette.neutral.textSecondary}
            x={cardX + 16}
            y={cardY + 24}
          >
            {attributes.code}
          </text>
          <text
            className="wbs-tree-node-title"
            fill={defaultGanttPalette.neutral.textPrimary}
            x={cardX + 16}
            y={cardY + 46}
          >
            {titleLines.map((line, index) => (
              <tspan dy={index === 0 ? 0 : 18} key={`${line}-${index}`} x={cardX + 16}>
                {line}
              </tspan>
            ))}
          </text>
          <text
            className="wbs-tree-node-kind"
            fill={defaultGanttPalette.neutral.textSecondary}
            x={cardX + 16}
            y={cardY + 84}
          >
            {attributes.kindLabel}
          </text>
          {!isRoot ? (
            <>
              {attributes.owner ? (
                <text
                  className="wbs-tree-node-owner"
                  fill={defaultGanttPalette.neutral.textSecondary}
                  x={cardX + 16}
                  y={cardY + 102}
                >
                  담당: {attributes.owner}
                </text>
              ) : null}
              <rect
                className="wbs-tree-status-badge"
                fill={statusFill}
                height={20}
                rx={6}
                width={74}
                x={cardX + cardWidth - 90}
                y={cardY + cardHeight - 34}
              />
              <text
                className="wbs-tree-status-text"
                fill={defaultGanttPalette.neutral.background}
                x={cardX + cardWidth - 53}
                y={cardY + cardHeight - 20}
              >
                {attributes.statusLabel}
              </text>
              {noteLines.length > 0 ? (
                <text
                  className="wbs-tree-node-notes"
                  fill={defaultGanttPalette.neutral.textSecondary}
                  x={cardX + 16}
                  y={cardY + cardHeight - 32}
                >
                  {noteLines.map((line, index) => (
                    <tspan
                      dy={index === 0 ? 0 : 14}
                      key={`${line}-${index}`}
                      x={cardX + 16}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              ) : null}
            </>
          ) : null}
        </g>
      );
    },
    [onSelectTask, selectedTaskId],
  );

  if (tasks.length === 0) {
    return (
      <div className="typed-gantt-preview typed-gantt-wbs">
        <div className="wbs-tree-surface">
          <div className="preview-placeholder">
            <p>항목을 추가하면 WBS Tree preview가 표시됩니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="typed-gantt-preview typed-gantt-wbs">
      <div className="wbs-tree-surface" ref={surfaceRef}>
        <div className="wbs-tree-canvas">
          <Tree
            data={treeData as RawNodeDatum}
            collapsible={false}
            depthFactor={180}
            draggable
            enableLegacyTransitions={false}
            orientation="vertical"
            pathClassFunc={() => "wbs-tree-link"}
            pathFunc="step"
            renderCustomNodeElement={renderCustomNodeElement}
            rootNodeClassName="wbs-tree-root"
            separation={{ nonSiblings: 1.45, siblings: 1.1 }}
            translate={{ x: surfaceSize.width / 2, y: 84 }}
            zoom={0.9}
            zoomable
          />
        </div>
      </div>
    </div>
  );
}
