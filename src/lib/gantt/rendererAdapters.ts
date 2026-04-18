import {
  getTaskDependencyIds,
  type GanttChartType,
  type GanttTask,
} from "./taskModel";
import { resolveGanttTaskVisual } from "./taskColorResolver";

export type JsGanttAdditionalHeaders = Record<
  string,
  {
    title: string;
    class?: string;
  }
>;

export type JsGanttTaskRow = {
  pID: number;
  pName: string;
  pStart: string;
  pEnd: string;
  pClass: string;
  pLink: string;
  pMile: 0 | 1;
  pRes: string;
  pComp: number;
  pGroup: 0 | 1;
  pParent: number;
  pOpen: 0 | 1;
  pDepend: string;
  pCaption: string;
  pNotes: string;
  pDataObject: Record<string, string>;
  sourceId: string;
  code?: string;
  domainId?: string;
  owner?: string;
  section?: string;
  stage?: string;
  status?: string;
};

export type JsGanttAdapterResult = {
  rows: JsGanttTaskRow[];
  additionalHeaders: JsGanttAdditionalHeaders;
};

export type MermaidAdapterResult = {
  kind: "gantt" | "treeView" | "mindmap";
  title: string;
  definition: string;
};

const milestoneHeaders: JsGanttAdditionalHeaders = {
  section: { title: "Section" },
  status: { title: "Status", class: "gantt-status-column" },
  owner: { title: "Owner" },
};

const wbsHeaders: JsGanttAdditionalHeaders = {
  code: { title: "Code" },
  stage: { title: "Stage" },
  owner: { title: "Owner" },
};

function createIdMap(tasks: GanttTask[]): Map<string, number> {
  return new Map(tasks.map((task, index) => [task.id, index + 1]));
}

function getNumericDependencyList(
  task: GanttTask,
  idMap: Map<string, number>,
): string {
  return getTaskDependencyIds(task)
    .map((id) => idMap.get(id))
    .filter((id): id is number => typeof id === "number")
    .join(",");
}

function getParentId(task: GanttTask, idMap: Map<string, number>): number {
  if (!task.parentId) {
    return 0;
  }

  return idMap.get(task.parentId) ?? 0;
}

function cleanMermaidText(value?: string): string {
  return (value || "Untitled")
    .replace(/[\r\n]+/g, " ")
    .replace(/:/g, " -")
    .replace(/,/g, " ")
    .trim();
}

function cleanMermaidId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getMilestoneDate(task: GanttTask): string {
  return task.date || task.start || task.end;
}

function getWbsDate(task: GanttTask): string {
  return task.date || task.start || task.end;
}

export function createMilestoneJsGanttRows(
  tasks: GanttTask[],
): JsGanttAdapterResult {
  const idMap = createIdMap(tasks);

  return {
    rows: tasks.map((task) => {
      const date = getMilestoneDate(task);

      return {
        pID: idMap.get(task.id) ?? 0,
        pName: task.name,
        pStart: date,
        pEnd: date,
        pClass: resolveGanttTaskVisual(task, {
          chartType: "milestones",
        }).cssClassName,
        pLink: "",
        pMile: 1,
        pRes: task.owner ?? "",
        pComp: 100,
        pGroup: 0,
        pParent: 0,
        pOpen: 1,
        pDepend: getNumericDependencyList(task, idMap),
        pCaption: task.status ?? "",
        pNotes: task.notes ?? "",
        domainId: task.id,
        section: task.section ?? "",
        status: task.status ?? "",
        owner: task.owner ?? "",
        pDataObject: {
          domainId: task.id,
          section: task.section ?? "",
          status: task.status ?? "",
          owner: task.owner ?? "",
        },
        sourceId: task.id,
      };
    }),
    additionalHeaders: milestoneHeaders,
  };
}

export function createWbsJsGanttRows(tasks: GanttTask[]): JsGanttAdapterResult {
  const idMap = createIdMap(tasks);

  return {
    rows: tasks.map((task) => {
      const nodeType = task.nodeType ?? "task";
      const isGroup = nodeType === "group";
      const isMilestone = nodeType === "milestone";
      const date = getWbsDate(task);

      return {
        pID: idMap.get(task.id) ?? 0,
        pName: task.name,
        pStart: isGroup ? task.start || "" : isMilestone ? date : task.start,
        pEnd: isGroup ? task.end || "" : isMilestone ? date : task.end,
        pClass: resolveGanttTaskVisual(task, { chartType: "wbs" }).cssClassName,
        pLink: "",
        pMile: isMilestone ? 1 : 0,
        pRes: task.owner ?? "",
        pComp: isGroup ? 0 : task.progress,
        pGroup: isGroup ? 1 : 0,
        pParent: getParentId(task, idMap),
        pOpen: task.open === false ? 0 : 1,
        pDepend: getNumericDependencyList(task, idMap),
        pCaption: task.stage ?? "",
        pNotes: task.notes ?? "",
        code: task.code ?? "",
        stage: task.stage ?? "",
        owner: task.owner ?? "",
        pDataObject: {
          code: task.code ?? "",
          stage: task.stage ?? "",
          owner: task.owner ?? "",
        },
        sourceId: task.id,
      };
    }),
    additionalHeaders: wbsHeaders,
  };
}

function getMermaidGanttTags(task: GanttTask): string[] {
  const tags = ["milestone"];

  if (task.status === "done") {
    tags.unshift("done");
  } else if (task.status === "on-track") {
    tags.unshift("active");
  }

  if (task.critical || task.status === "at-risk" || task.status === "blocked") {
    tags.unshift("crit");
  }

  return tags;
}

export function createMilestoneMermaidGantt(
  tasks: GanttTask[],
): MermaidAdapterResult {
  const lines = [
    "gantt",
    "    title Milestone Plan",
    "    dateFormat YYYY-MM-DD",
    "    axisFormat %m/%d",
    "    tickInterval 1week",
    "    weekday monday",
    "    todayMarker off",
  ];
  const sectionGroups = new Map<string, GanttTask[]>();

  tasks.forEach((task) => {
    const section = cleanMermaidText(task.section || "Milestones");
    sectionGroups.set(section, [...(sectionGroups.get(section) ?? []), task]);
  });

  sectionGroups.forEach((sectionTasks, section) => {
    lines.push(`    section ${section}`);
    sectionTasks.forEach((task) => {
      const id = cleanMermaidId(task.id);
      const tags = getMermaidGanttTags(task).join(", ");
      const dependsOn = getTaskDependencyIds(task)
        .map(cleanMermaidId)
        .filter(Boolean)
        .join(" ");
      const start = dependsOn ? `after ${dependsOn}` : getMilestoneDate(task);

      lines.push(
        `    ${cleanMermaidText(task.name)} :${tags}, ${id}, ${start}, 1d`,
      );

      if (task.critical) {
        lines.push(
          `    ${cleanMermaidText(task.name)} deadline :vert, ${id}-vert, ${getMilestoneDate(task)}, 0d`,
        );
      }
    });
  });

  return {
    kind: "gantt",
    title: "Mermaid Gantt",
    definition: lines.join("\n"),
  };
}

type TreeNode = {
  task: GanttTask;
  children: TreeNode[];
};

function buildWbsTree(tasks: GanttTask[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>(
    tasks.map((task) => [task.id, { task, children: [] }]),
  );
  const roots: TreeNode[] = [];

  nodeMap.forEach((node) => {
    if (node.task.parentId && nodeMap.has(node.task.parentId)) {
      nodeMap.get(node.task.parentId)?.children.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
}

function getWbsNodeLabel(task: GanttTask): string {
  const code = task.code ? `${task.code} ` : "";
  const nodeType = task.nodeType ?? "task";
  const owner = task.owner ? ` - ${task.owner}` : "";

  return `${code}${task.name} - ${nodeType}${owner}`;
}

function appendTreeViewNode(lines: string[], node: TreeNode, depth: number) {
  lines.push(
    `${"    ".repeat(depth)}"${cleanMermaidText(getWbsNodeLabel(node.task))}"`,
  );
  node.children.forEach((child) => appendTreeViewNode(lines, child, depth + 1));
}

function appendMindmapNode(lines: string[], node: TreeNode, depth: number) {
  lines.push(
    `${"  ".repeat(depth)}${cleanMermaidText(getWbsNodeLabel(node.task))}`,
  );
  node.children.forEach((child) => appendMindmapNode(lines, child, depth + 1));
}

export function createWbsMermaidTreeView(
  tasks: GanttTask[],
): MermaidAdapterResult {
  const lines = ["treeView-beta"];

  buildWbsTree(tasks).forEach((node) => appendTreeViewNode(lines, node, 1));

  return {
    kind: "treeView",
    title: "Mermaid TreeView",
    definition: lines.join("\n"),
  };
}

export function createWbsMermaidMindmap(
  tasks: GanttTask[],
): MermaidAdapterResult {
  const lines = ["mindmap", "  root((WBS))"];

  buildWbsTree(tasks).forEach((node) => appendMindmapNode(lines, node, 2));

  return {
    kind: "mindmap",
    title: "Mermaid Mindmap",
    definition: lines.join("\n"),
  };
}

export function createJsGanttRowsForType(
  chartType: GanttChartType,
  tasks: GanttTask[],
): JsGanttAdapterResult {
  if (chartType === "wbs") {
    return createWbsJsGanttRows(tasks);
  }

  return createMilestoneJsGanttRows(tasks);
}
