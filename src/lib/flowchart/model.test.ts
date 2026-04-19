import {
  createSampleFlowchartDocument,
  hasBlockingFlowchartIssues,
  validateFlowchartDocument,
} from "./model";

describe("flowchart model", () => {
  it("accepts the sample flowchart document", () => {
    const sample = createSampleFlowchartDocument();

    expect(validateFlowchartDocument(sample)).toEqual([]);
  });

  it("rejects a decision step with fewer than two branches", () => {
    const sample = createSampleFlowchartDocument();
    const decisionStep = sample.steps.find((step) => step.type === "decision");

    if (!decisionStep) {
      throw new Error("expected a decision step in sample data");
    }

    decisionStep.branches = decisionStep.branches.slice(0, 1);

    const issues = validateFlowchartDocument(sample);

    expect(hasBlockingFlowchartIssues(issues)).toBe(true);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stepId: decisionStep.id,
          severity: "error",
        }),
      ]),
    );
  });

  it("rejects unreachable steps", () => {
    const sample = createSampleFlowchartDocument();
    const secondStep = sample.steps[1];

    if (!secondStep) {
      throw new Error("expected second step in sample data");
    }

    secondStep.nextStepId = "";

    const issues = validateFlowchartDocument(sample);

    expect(hasBlockingFlowchartIssues(issues)).toBe(true);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("도달할 수 없는 단계"),
          severity: "error",
        }),
      ]),
    );
  });

  it("reports loops as warnings instead of blocking errors", () => {
    const sample = createSampleFlowchartDocument();
    const decisionStep = sample.steps.find((step) => step.id === "flow-step-7");

    if (!decisionStep || decisionStep.type !== "decision") {
      throw new Error("expected sample review decision step");
    }

    decisionStep.branches[0] = {
      ...decisionStep.branches[0],
      targetStepId: "flow-step-2",
    };
    decisionStep.branches[1] = {
      ...decisionStep.branches[1],
      targetStepId: "flow-step-8",
    };

    const issues = validateFlowchartDocument(sample);

    expect(issues.some((issue) => issue.severity === "warning")).toBe(true);
    expect(hasBlockingFlowchartIssues(issues)).toBe(false);
  });
});
