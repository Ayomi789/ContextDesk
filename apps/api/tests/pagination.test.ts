import { describe, expect, it } from "vitest";
import { parsePagination } from "../src/utils/pagination";

describe("parsePagination", () => {
  it("defaults to page 1, limit 50", () => {
    expect(parsePagination({})).toEqual({
      page: 1,
      limit: 50,
      skip: 0,
    });
  });

  it("parses valid page and limit", () => {
    expect(parsePagination({ page: "3", limit: "10" })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  it("clamps limit to 100", () => {
    expect(parsePagination({ limit: "9999" }).limit).toBe(100);
  });

  it("falls back on garbage input", () => {
    expect(parsePagination({ page: "nope", limit: "-5" })).toEqual({
      page: 1,
      limit: 50,
      skip: 0,
    });
  });
});
