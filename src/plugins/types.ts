import type { ComponentType } from "react";

export type ToolStatus = "active" | "coming-soon";
export type ToolPhase = "skeleton" | "mvp";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  href: string;
  shortCode: string;
  status: ToolStatus;
  phase: ToolPhase;
  order: number;
  component?: ComponentType;
};
