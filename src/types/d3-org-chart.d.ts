declare module "d3-org-chart" {
  export class OrgChart<TData = unknown> {
    childrenMargin: (value: number | ((node: unknown) => number)) => this;
    compact: (value: boolean) => this;
    compactMarginBetween: (value: number | ((node: unknown) => number)) => this;
    container: (value: HTMLElement | string) => this;
    data: (value: TData[]) => this;
    duration: (value: number) => this;
    fit: () => this;
    layout: (value: "top" | "left" | "right" | "bottom") => this;
    nodeButtonHeight: (value: number | ((node: unknown) => number)) => this;
    nodeButtonWidth: (value: number | ((node: unknown) => number)) => this;
    nodeContent: (
      value: (node: { data: TData }) => string,
    ) => this;
    nodeHeight: (value: number | ((node: unknown) => number)) => this;
    nodeId: (value: (data: TData) => string) => this;
    nodeWidth: (value: number | ((node: unknown) => number)) => this;
    onNodeClick: (value: (node: { data: TData }) => void) => this;
    parentNodeId: (value: (data: TData) => string) => this;
    render: () => this;
    setExpanded: (id: string, expanded?: boolean) => this;
  }
}
