"use client";

import { useMemo } from "react";
import {
  flowchartNodeTypeOptions,
  getFallbackFlowchartLayout,
  type FlowchartDirection,
  type FlowchartLayoutNode,
  type FlowchartDocument,
  type FlowchartNodeType,
} from "@/lib/flowchart/model";

type FlowchartPreviewProps = {
  document: FlowchartDocument;
  onSelectStep: (stepId: string) => void;
  selectedStepId?: string;
};

type EdgeGeometry = {
  labelX: number;
  labelY: number;
  path: string;
};

function getNodeTypeLabel(nodeType: FlowchartNodeType) {
  return (
    flowchartNodeTypeOptions.find((option) => option.value === nodeType)?.label ??
    "단계"
  );
}

function getEdgeGeometry(
  sourceStep: FlowchartLayoutNode,
  targetStep: FlowchartLayoutNode,
  direction: FlowchartDirection,
): EdgeGeometry {
  if (direction === "LR") {
    const startX = sourceStep.position.x + sourceStep.size.width;
    const startY = sourceStep.position.y + sourceStep.size.height / 2;
    const endX = targetStep.position.x;
    const endY = targetStep.position.y + targetStep.size.height / 2;
    const midX = startX + (endX - startX) / 2;

    return {
      path: `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`,
      labelX: midX,
      labelY: startY + (endY - startY) / 2 - 8,
    };
  }

  const startX = sourceStep.position.x + sourceStep.size.width / 2;
  const startY = sourceStep.position.y + sourceStep.size.height;
  const endX = targetStep.position.x + targetStep.size.width / 2;
  const endY = targetStep.position.y;
  const midY = startY + (endY - startY) / 2;

  return {
    path: `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`,
    labelX: startX + (endX - startX) / 2,
    labelY: midY - 8,
  };
}

export function FlowchartPreview({
  document,
  onSelectStep,
  selectedStepId,
}: FlowchartPreviewProps) {
  const layout = useMemo(() => getFallbackFlowchartLayout(document), [document]);
  const stepMap = useMemo(
    () => new Map(layout.steps.map((step) => [step.id, step])),
    [layout.steps],
  );
  const canvasWidth = useMemo(
    () =>
      Math.max(
        720,
        ...layout.steps.map((step) => step.position.x + step.size.width + 80),
      ),
    [layout.steps],
  );
  const canvasHeight = useMemo(
    () =>
      Math.max(
        520,
        ...layout.steps.map((step) => step.position.y + step.size.height + 120),
      ),
    [layout.steps],
  );

  if (document.steps.length === 0) {
    return (
      <div className="preview-placeholder">
        <strong>{document.title || "새 플로우차트"}</strong>
        <p>단계를 추가하면 표준 기호와 분기 라벨이 반영된 미리보기가 여기에서 열립니다.</p>
      </div>
    );
  }

  return (
    <div className="flowchart-preview-surface">
      <div
        className="flowchart-static-canvas"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <svg
          aria-hidden="true"
          className="flowchart-static-edge-layer"
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        >
          <defs>
            <marker
              id="flowchart-arrowhead"
              markerHeight="8"
              markerWidth="8"
              orient="auto-start-reverse"
              refX="8"
              refY="4"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#94A3B8" />
            </marker>
          </defs>

          {layout.connections.map((connection) => {
            const sourceStep = stepMap.get(connection.sourceStepId);
            const targetStep = stepMap.get(connection.targetStepId);

            if (!sourceStep || !targetStep) {
              return null;
            }

            const geometry = getEdgeGeometry(
              sourceStep,
              targetStep,
              document.direction,
            );

            return (
              <g key={connection.id}>
                <path
                  className="flowchart-static-edge-path"
                  d={geometry.path}
                  markerEnd="url(#flowchart-arrowhead)"
                />
                {connection.label ? (
                  <text
                    className="flowchart-edge-label"
                    textAnchor="middle"
                    x={geometry.labelX}
                    y={geometry.labelY}
                  >
                    {connection.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {layout.steps.map((step) => {
          const hasCaption = Boolean(step.lane?.trim() || step.owner?.trim());

          return (
            <button
              className={`flowchart-node flowchart-static-node flowchart-node-${step.type}${
                selectedStepId === step.id ? " is-selected" : ""
              }`}
              key={step.id}
              style={{
                left: step.position.x,
                top: step.position.y,
              }}
              type="button"
              onClick={() => onSelectStep(step.id)}
            >
              <div className={`flowchart-node-symbol flowchart-node-symbol-${step.type}`}>
                <div className="flowchart-node-symbol-inner">
                  <div className="flowchart-node-type">{getNodeTypeLabel(step.type)}</div>
                  <div className="flowchart-node-title">{step.label || "이름 없는 단계"}</div>
                </div>
              </div>

              {hasCaption ? (
                <div className="flowchart-node-caption">
                  {step.lane?.trim() ? <span>{step.lane.trim()}</span> : null}
                  {step.owner?.trim() ? <span>{step.owner.trim()}</span> : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
