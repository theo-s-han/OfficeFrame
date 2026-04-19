"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  buildFlowchartLayout,
  flowchartNodeTypeOptions,
  type FlowchartNodeType,
  type FlowchartState,
} from "@/lib/flowchart/model";

type FlowNodeData = {
  color?: string;
  lane?: string;
  name: string;
  notes?: string;
  owner?: string;
  selected: boolean;
  status?: string;
  type: FlowchartNodeType;
};

type FlowchartPreviewProps = {
  selectedNodeId?: string;
  state: FlowchartState;
  onSelectNode: (nodeId: string) => void;
};

function getNodeTypeLabel(nodeType: FlowchartNodeType) {
  return (
    flowchartNodeTypeOptions.find((option) => option.value === nodeType)?.label ??
    "단계"
  );
}

function FlowNodeCard({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div
      className={`flowchart-node flowchart-node-${data.type}${data.selected ? " is-selected" : ""}`}
      style={{ "--flow-node-accent": data.color ?? "#5B6EE1" } as React.CSSProperties}
    >
      {data.type !== "start" ? <Handle position={Position.Left} type="target" /> : null}
      <div className="flowchart-node-badge">{getNodeTypeLabel(data.type)}</div>
      <div className="flowchart-node-title">{data.name}</div>
      <div className="flowchart-node-meta">
        <span>{data.lane?.trim() || "기본 흐름"}</span>
        <span>{data.owner?.trim() || "담당자 미정"}</span>
      </div>
      <div className="flowchart-node-notes">
        {data.notes?.trim() || "설명이 비어 있습니다."}
      </div>
      {data.type !== "end" ? <Handle position={Position.Right} type="source" /> : null}
    </div>
  );
}

const nodeTypes = {
  officeNode: FlowNodeCard,
};

export function FlowchartPreview({
  selectedNodeId,
  state,
  onSelectNode,
}: FlowchartPreviewProps) {
  const layout = useMemo(() => buildFlowchartLayout(state), [state]);

  const nodes = useMemo<Array<Node<FlowNodeData>>>(
    () =>
      layout.nodes.map((node) => ({
        id: node.id,
        type: "officeNode",
        position: node.position,
        data: {
          name: node.name,
          type: node.type,
          lane: node.lane,
          owner: node.owner,
          notes: node.notes,
          status: node.status,
          color: node.color,
          selected: selectedNodeId === node.id,
        },
        draggable: false,
        selectable: true,
      })),
    [layout.nodes, selectedNodeId],
  );

  const edges = useMemo<Array<Edge>>(
    () =>
      layout.edges.map((edge) => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label || undefined,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#98A2B3",
        },
        style: {
          stroke: "#98A2B3",
          strokeWidth: 1.4,
        },
        labelStyle: {
          fill: "#667085",
          fontSize: 12,
          fontWeight: 700,
        },
      })),
    [layout.edges],
  );

  if (nodes.length === 0) {
    return (
      <div className="preview-placeholder">
        <strong>{state.title}</strong>
        <p>단계와 연결을 추가하면 플로우차트가 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="flowchart-preview-surface">
      <ReactFlow
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => onSelectNode(node.id)}
      >
        <Background color="#E6E8EC" gap={28} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}
