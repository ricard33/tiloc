import setDefaults from "./set.defaults";

describe("setDefaults()", () => {
  it("fills in missing optional properties from the defaults", () => {
    const result = setDefaults<{ a: number; b?: string }>({ a: 1 }, { b: "fallback" });
    expect(result).toEqual({ a: 1, b: "fallback" });
  });

  it("keeps a provided value over the default", () => {
    const result = setDefaults<{ a: number; b?: string }>({ a: 1, b: "given" }, { b: "fallback" });
    expect(result.b).toEqual("given");
  });

  it("treats an explicit undefined as missing", () => {
    const result = setDefaults<{ a: number; b?: string }>({ a: 1, b: undefined }, { b: "fallback" });
    expect(result.b).toEqual("fallback");
  });

  it("does not mutate the original props object", () => {
    const props = { a: 1 } as { a: number; b?: string };
    setDefaults(props, { b: "fallback" });
    expect(props).toEqual({ a: 1 });
  });
});
