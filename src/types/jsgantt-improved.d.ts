declare module "jsgantt-improved" {
  type JsGanttNamespace = {
    GanttChart: new (
      element: HTMLElement,
      format: string,
    ) => {
      AddTaskItemObject: (task: unknown) => void;
      Draw: () => void;
      setAdditionalHeaders?: (headers: unknown) => void;
      setCaptionType?: (value: string) => void;
      setDateInputFormat?: (value: string) => void;
      setDateTaskTableDisplayFormat?: (value: string) => void;
      setShowComp?: (value: number) => void;
      setShowCost?: (value: number) => void;
      setShowDur?: (value: number) => void;
      setShowEndDate?: (value: number) => void;
      setShowPlanEndDate?: (value: number) => void;
      setShowPlanStartDate?: (value: number) => void;
      setShowRes?: (value: number) => void;
      setShowSelector?: (value: string) => void;
      setShowStartDate?: (value: number) => void;
      setTotalHeight?: (value: string) => void;
      setUseSingleCell?: (value: number) => void;
    };
  };

  export const JSGantt: JsGanttNamespace | undefined;
  const defaultExport: JsGanttNamespace;
  export default defaultExport;
}
