import { deepDiff, deepDiffMapper, filterObject } from "./objectDiff";

describe("Module objectDiff:", () => {
  describe("deepDiffMapper.map()", () => {
    it("flags created, updated, deleted and unchanged leaves", () => {
      const result = deepDiffMapper.map(
        { kept: 1, changed: "a", removed: true },
        { kept: 1, changed: "b", added: 42 }
      );

      expect(result.kept).toEqual({ type: "unchanged", data: 1 });
      expect(result.changed).toEqual({ type: "updated", data: "a" });
      expect(result.removed).toEqual({ type: "deleted", data: true });
      expect(result.added).toEqual({ type: "created", data: 42 });
    });

    it("recurses into nested objects", () => {
      const result = deepDiffMapper.map(
        { nested: { a: 1, b: 2 } },
        { nested: { a: 1, b: 3 } }
      );

      expect(result.nested.a).toEqual({ type: "unchanged", data: 1 });
      expect(result.nested.b).toEqual({ type: "updated", data: 2 });
    });

    it("treats equal Date values as unchanged", () => {
      const d1 = new Date("2024-01-01T00:00:00Z");
      const d2 = new Date("2024-01-01T00:00:00Z");
      expect(deepDiffMapper.map({ when: d1 }, { when: d2 }).when.type).toEqual("unchanged");
    });

    it("throws when given a function", () => {
      expect(() => deepDiffMapper.map(() => 0 as never, {})).toThrow(/Function given/);
    });
  });

  describe("filterObject()", () => {
    it("keeps only entries matching the predicate", () => {
      expect(filterObject({ a: 1, b: 2, c: 3 }, (v) => v > 1)).toEqual({ b: 2, c: 3 });
    });

    it("passes the key as the second argument", () => {
      expect(filterObject({ keep: 1, drop: 1 }, (_v, k) => k === "keep")).toEqual({ keep: 1 });
    });
  });

  describe("deepDiff()", () => {
    it("returns only the changed keys", () => {
      expect(deepDiff({ a: 1, b: 2 }, { a: 1, b: 5 })).toEqual({
        b: { type: "updated", data: 2 },
      });
    });

    it("is empty when nothing changed", () => {
      expect(deepDiff({ a: 1 }, { a: 1 })).toEqual({});
    });
  });
});
