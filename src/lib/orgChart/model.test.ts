import {
  createSampleOrgChartState,
  validateOrgChartState,
} from "./model";

describe("orgChart model", () => {
  it("accepts sample data", () => {
    const sample = createSampleOrgChartState();

    expect(validateOrgChartState(sample.nodes)).toEqual([]);
  });

  it("rejects self parent references", () => {
    const sample = createSampleOrgChartState();
    const target = sample.nodes[1];

    target.parentId = target.id;

    expect(validateOrgChartState(sample.nodes)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: target.id,
          field: "parentId",
        }),
      ]),
    );
  });
});
