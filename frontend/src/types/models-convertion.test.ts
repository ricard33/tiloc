import { toDecimal, toNumberOrUndefined } from "./models-convertion";

describe("Models conversions", function() {
  it("toNumber", () => {
    expect(toNumberOrUndefined("23")).toEqual(23);
    expect(toNumberOrUndefined("23.35")).toEqual(23.35);
    expect(toNumberOrUndefined(undefined)).toBeUndefined();
  });

  it("toDecimal", () => {
    expect(toDecimal(23)).toEqual("23.00");
    expect(toDecimal(23.35)).toEqual("23.35");
    expect(toDecimal(23.3555)).toEqual("23.36");
    expect(toDecimal(23.3554, 3)).toEqual("23.355");
    expect(toDecimal(23.3556, 3)).toEqual("23.356");
    expect(toDecimal(undefined)).toBeNull();
  });

});
