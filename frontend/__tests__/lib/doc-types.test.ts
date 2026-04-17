import { mergeDocFields, GenericDocFields } from "../../lib/doc-types";

describe("mergeDocFields", () => {
  it("merges non-null, non-empty incoming values", () => {
    const current: GenericDocFields = { a: "old", b: "keep" };
    const incoming = { a: "new", c: "added" };
    const result = mergeDocFields(current, incoming);
    expect(result).toEqual({ a: "new", b: "keep", c: "added" });
  });

  it("ignores null incoming values", () => {
    const current: GenericDocFields = { a: "keep" };
    const incoming = { a: null, b: "new" };
    const result = mergeDocFields(current, incoming);
    expect(result).toEqual({ a: "keep", b: "new" });
  });

  it("ignores empty string incoming values", () => {
    const current: GenericDocFields = { a: "keep" };
    const incoming = { a: "" };
    const result = mergeDocFields(current, incoming);
    expect(result).toEqual({ a: "keep" });
  });

  it("returns current if incoming is undefined", () => {
    const current: GenericDocFields = { a: "keep" };
    const result = mergeDocFields(current, undefined);
    expect(result).toEqual({ a: "keep" });
  });

  it("works with empty current and populates from incoming", () => {
    const result = mergeDocFields({}, { x: "hello", y: null });
    expect(result).toEqual({ x: "hello" });
  });

  it("does not mutate the original current object", () => {
    const current: GenericDocFields = { a: "old" };
    const result = mergeDocFields(current, { a: "new" });
    expect(current.a).toBe("old");
    expect(result.a).toBe("new");
  });
});
