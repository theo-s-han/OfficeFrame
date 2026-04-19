"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CustomNodeElementProps, RawNodeDatum } from "react-d3-tree";
import { defaultGanttPalette } from "@/lib/gantt/theme";
import type { GanttTask, WbsStructureType } from "@/lib/gantt/taskModel";
import { buildWbsPreviewData } from "@/lib/gantt/wbsTree";
import {
  defaultWbsTreeSeparation,
  defaultWbsTreeZoom,
  getWbsTextLineLimit,
  getWbsTreeNodeLayout,
  getWbsTreeNodeSize,
  getWbsTreePreviewTransform,
  splitWbsPreviewLines,
} from "@/lib/gantt/wbsTreePreviewLayout";

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

type WbsPreviewNodeAttributes = Record<string, string>;

type WbsPreviewNode = {
  attributes?: WbsPreviewNodeAttributes;
  children?: WbsPreviewNode[];
  name?: string;
};

const statusFillMap = {
  done: defaultGanttPalette.semantic.success,
  "in-progress": defaultGanttPalette.taskColors[1],
  "not-started": defaultGanttPalette.neutral.secondaryBar,
} as const;

function toNodeAttributes(nodeDatum: Pick<RawNodeDatum, "attributes">): WbsPreviewNodeAttributes {
  const rawAttributes = nodeDatum.attributes ?? {};

  return Object.fromEntries(
    Object.entries(rawAttributes).map(([key, value]) => [key, String(value ?? "")]),
  );
}

function resolveWbsNodeTextLayout(nodeDatum: {
  attributes?: RawNodeDatum["attributes"];
  name?: RawNodeDatum["name"];
}) {
  const attributes = toNodeAttributes(nodeDatum);
  const sourceId = attributes.sourceId ?? "";
  const kind = attributes.kind ?? "";
  const notes = attributes.notes ?? "";
  const isRoot = kind === "project";
  const name =
    typeof nodeDatum.name === "string" ? nodeDatum.name : String(nodeDatum.name ?? "");
  const baseLayout = getWbsTreeNodeLayout({
    isRoot,
    titleLineCount: 1,
  });
  const titleLines = splitWbsPreviewLines(
    name,
    getWbsTextLineLimit(baseLayout.cardWidth, {
      fontSize: isRoot ? 13.5 : 13,
    }),
  );
  const ownerLines = splitWbsPreviewLines(
    attributes.owner ? `담당: ${attributes.owner}` : "",
    getWbsTextLineLimit(baseLayout.cardWidth, {
      fontSize: 12,
    }),
  );
  const noteLines = splitWbsPreviewLines(
    notes,
    getWbsTextLineLimit(baseLayout.cardWidth, {
      fontSize: 12,
    }),
  );
  const layout = getWbsTreeNodeLayout({
    isRoot,
    noteLineCount: noteLines.length,
    ownerLineCount: ownerLines.length,
    titleLineCount: titleLines.length,
  });
  const statusKey = (attributes.status ?? "not-started") as keyof typeof statusFillMap;

  return {
    attributes,
    isRoot,
    kind,
    layout,
    noteLines,
    ownerLines,
    sourceId,
    statusFill: statusFillMap[statusKey] ?? defaultGanttPalette.neutral.secondaryBar,
    titleLines,
  };
}

function getMaxWbsCardHeight(node: WbsPreviewNode): number {
  const currentHeight = resolveWbsNodeTextLayout({
    attributes: node.attributes,
    name: node.name,
  }).layout.cardHeight;
  const childHeights = (node.children ?? []).map((child) => getMaxWbsCardHeight(child));

  return Math.max(currentHeight, ...childHeights, 0);
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
  const treeNodeSize = useMemo(
    () => getWbsTreeNodeSize(getMaxWbsCardHeight(treeData as WbsPreviewNode)),
    [treeData],
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
      const { attributes, isRoot, kind, layout, noteLines, ownerLines, sourceId, statusFill, titleLines } =
        resolveWbsNodeTextLayout(nodeDatum);
      const isSelected = Boolean(sourceId) && sourceId === selectedTaskId;
      const cardWidth = layout.cardWidth;
      const cardHeight = layout.cardHeight;
      const cardX = -cardWidth / 2;
      const cardY = -cardHeight / 2;
      const clipId = `wbs-tree-node-clip-${sourceId || "root"}`;

      return (
        <g
          className={`wbs-tree-node${isRoot ? " is-root" : ""}${isSelected ? " is-selected" : ""}`}
          onClick={() => {
            if (sourceId) {
              onSelectTask(sourceId);
            }
          }}
          onKeyDown={(event) => {
            if (!sourceId) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectTask(sourceId);
            }
          }}
          role={sourceId ? "button" : undefined}
          tabIndex={sourceId ? 0 : undefined}
        >
          <defs>
            <clipPath id={clipId}>
              <rect height={cardHeight} rx={8} width={cardWidth} x={cardX} y={cardY} />
            </clipPath>
          </defs>

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
            stroke={
              isSelected
                ? defaultGanttPalette.taskColors[0]
                : defaultGanttPalette.neutral.rowDivider
            }
            strokeWidth={isSelected ? 2 : 1}
            width={cardWidth}
            x={cardX}
            y={cardY}
          />

          <g clipPath={`url(#${clipId})`}>
            <rect
              fill={
                isRoot
                  ? defaultGanttPalette.taskColors[0]
                  : kind === "work-package"
                    ? defaultGanttPalette.neutral.surface
                    : defaultGanttPalette.taskColors[1]
              }
              height={layout.barHeight}
              rx={8}
              width={cardWidth}
              x={cardX}
              y={cardY}
            />

            <text
              className="wbs-tree-node-meta"
              dominantBaseline="hanging"
              fill={defaultGanttPalette.neutral.textSecondary}
              x={cardX + layout.contentX}
              y={cardY + layout.codeY}
            >
              {attributes.code}
            </text>

            <text
              className="wbs-tree-node-title"
              dominantBaseline="hanging"
              fill={defaultGanttPalette.neutral.textPrimary}
              x={cardX + layout.contentX}
              y={cardY + layout.titleY}
            >
              {titleLines.map((line, index) => (
                <tspan
                  dy={index === 0 ? 0 : layout.titleLineHeight}
                  key={`${line}-${index}`}
                  x={cardX + layout.contentX}
                >
                  {line}
                </tspan>
              ))}
            </text>

            <text
              className="wbs-tree-node-kind"
              dominantBaseline="hanging"
              fill={defaultGanttPalette.neutral.textSecondary}
              x={cardX + layout.contentX}
              y={cardY + layout.kindY}
            >
              {attributes.kindLabel}
            </text>

            {!isRoot ? (
              <>
                {ownerLines.length > 0 ? (
                  <text
                    className="wbs-tree-node-owner"
                    dominantBaseline="hanging"
                    fill={defaultGanttPalette.neutral.textSecondary}
                    x={cardX + layout.contentX}
                    y={cardY + (layout.ownerY ?? layout.kindY)}
                  >
                    {ownerLines.map((line, index) => (
                      <tspan
                        dy={index === 0 ? 0 : layout.ownerLineHeight}
                        key={`${line}-${index}`}
                        x={cardX + layout.contentX}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                ) : null}

                {noteLines.length > 0 ? (
                  <text
                    className="wbs-tree-node-notes"
                    dominantBaseline="hanging"
                    fill={defaultGanttPalette.neutral.textSecondary}
                    x={cardX + layout.contentX}
                    y={cardY + (layout.noteY ?? layout.kindY)}
                  >
                    {noteLines.map((line, index) => (
                      <tspan
                        dy={index === 0 ? 0 : layout.noteLineHeight}
                        key={`${line}-${index}`}
                        x={cardX + layout.contentX}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                ) : null}

                <rect
                  className="wbs-tree-status-badge"
                  fill={statusFill}
                  height={layout.badgeHeight}
                  rx={6}
                  width={layout.badgeWidth}
                  x={cardX + layout.badgeX}
                  y={cardY + layout.badgeY}
                />
                <text
                  className="wbs-tree-status-text"
                  dominantBaseline="middle"
                  fill={defaultGanttPalette.neutral.background}
                  textAnchor="middle"
                  x={cardX + layout.statusTextX}
                  y={cardY + layout.statusTextY}
                >
                  {attributes.statusLabel}
                </text>
              </>
            ) : null}
          </g>
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
            collapsible={false}
            data={treeData as RawNodeDatum}
            draggable
            enableLegacyTransitions={false}
            nodeSize={treeNodeSize}
            orientation="vertical"
            pathClassFunc={() => "wbs-tree-link"}
            pathFunc="step"
            renderCustomNodeElement={renderCustomNodeElement}
            rootNodeClassName="wbs-tree-root"
            separation={defaultWbsTreeSeparation}
            translate={getWbsTreePreviewTransform(surfaceSize.width)}
            zoom={defaultWbsTreeZoom}
            zoomable
          />
        </div>
      </div>
    </div>
  );
}
