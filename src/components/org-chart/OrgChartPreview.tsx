"use client";

import { useEffect, useRef, useState } from "react";
import type { OrgChart as OrgChartInstance } from "d3-org-chart";
import {
  getOrgChartStatusLabel,
  type OrgChartDirection,
  type OrgChartNode,
} from "@/lib/orgChart/model";

type OrgChartPreviewProps = {
  direction: OrgChartDirection;
  nodes: OrgChartNode[];
  orgName: string;
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getStatusClassName(status?: OrgChartNode["status"]) {
  if (status === "planned") {
    return "planned";
  }

  if (status === "vacant") {
    return "vacant";
  }

  return "active";
}

function createNodeMarkup(node: OrgChartNode, selected: boolean) {
  const accent = node.color ?? "#5B6EE1";
  const cardTitle = escapeHtml(node.name || "이름 없음");
  const title = escapeHtml(node.title?.trim() || "직책 미정");
  const department = escapeHtml(node.department?.trim() || "부서 미정");
  const notes = escapeHtml(node.notes?.trim() || "");
  const statusLabel = escapeHtml(getOrgChartStatusLabel(node.status));
  const selectedClassName = selected ? "is-selected" : "";
  const statusClassName = getStatusClassName(node.status);

  return `
    <div class="orgchart-node-card ${selectedClassName}" style="--orgchart-node-accent:${accent}">
      <div class="orgchart-node-top">
        <span class="orgchart-node-department">${department}</span>
        <span class="orgchart-node-status ${statusClassName}">${statusLabel}</span>
      </div>
      <div class="orgchart-node-name">${cardTitle}</div>
      <div class="orgchart-node-title">${title}</div>
      ${
        notes
          ? `<div class="orgchart-node-notes">${notes}</div>`
          : `<div class="orgchart-node-notes muted">설명이 비어 있습니다.</div>`
      }
    </div>
  `;
}

export function OrgChartPreview({
  direction,
  nodes,
  orgName,
  selectedNodeId,
  onSelectNode,
}: OrgChartPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    let cancelled = false;

    async function renderChart() {
      if (!container || nodes.length === 0) {
        return;
      }

      try {
        const { OrgChart } = await import("d3-org-chart");

        if (cancelled) {
          return;
        }

        const chart = new OrgChart<OrgChartNode>() as OrgChartInstance<OrgChartNode>;

        container.innerHTML = "";
        chart
          .container(container)
          .data(
            nodes.map((node) => ({
              ...node,
              parentId: node.parentId ?? "",
            })),
          )
          .layout(direction)
          .compact(false)
          .duration(0)
          .nodeId((node) => node.id)
          .parentNodeId((node) => node.parentId ?? "")
          .nodeWidth(() => 292)
          .nodeHeight(() => 172)
          .childrenMargin(() => 54)
          .compactMarginBetween(() => 26)
          .nodeButtonWidth(() => 0)
          .nodeButtonHeight(() => 0)
          .onNodeClick((node) => onSelectNode(node.data.id))
          .nodeContent((node) =>
            createNodeMarkup(node.data, selectedNodeId === node.data.id),
          )
          .render();

        nodes.forEach((node) => {
          chart.setExpanded(node.id, true);
        });

        chart.render().fit();

        if (!cancelled) {
          setRenderError("");
        }
      } catch (error) {
        if (!cancelled) {
          setRenderError(
            error instanceof Error
              ? error.message
              : "조직도 preview를 렌더링하지 못했습니다.",
          );
        }
      }
    }

    void renderChart();

    return () => {
      cancelled = true;

      if (container) {
        container.innerHTML = "";
      }
    };
  }, [direction, nodes, onSelectNode, selectedNodeId, containerRef]);

  if (nodes.length === 0) {
    return (
      <div className="preview-placeholder">
        <strong>{orgName}</strong>
        <p>조직 항목을 추가하면 카드형 조직도가 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="orgchart-preview-surface">
      <div className="orgchart-preview-stage">
        <div className="orgchart-preview-canvas" ref={containerRef} />
      </div>
      {renderError ? (
        <div className="validation-summary" role="alert">
          {renderError}
        </div>
      ) : null}
    </div>
  );
}
