import {
  createSampleFlowchartState,
  validateFlowchartState,
} from "./model";

describe("flowchart model", () => {
  it("accepts sample data", () => {
    const sample = createSampleFlowchartState();

    expect(validateFlowchartState(sample)).toEqual([]);
  });

  it("rejects self loop edges", () => {
    const sample = createSampleFlowchartState();

    sample.edges[0] = {
      ...sample.edges[0],
      targetId: sample.edges[0]?.sourceId ?? "",
    };

    expect(validateFlowchartState(sample)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          edgeId: sample.edges[0]?.id,
          field: "edge",
        }),
      ]),
    );
  });
});
