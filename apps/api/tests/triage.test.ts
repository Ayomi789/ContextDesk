import { describe, expect, it } from "vitest";
import { parseTriageResponse } from "../src/services/ai.service";

describe("parseTriageResponse", () => {
  it("accepts exact contract JSON", () => {
    expect(
      parseTriageResponse(
        '{"priority": "URGENT", "reason": "Production is down"}'
      )
    ).toEqual({
      priority: "URGENT",
      reason: "Production is down",
    });
  });

  it("tolerates markdown fences", () => {
    expect(
      parseTriageResponse(
        '```json\n{"priority": "LOW", "reason": "How-to question"}\n```'
      )
    ).toEqual({
      priority: "LOW",
      reason: "How-to question",
    });
  });

  it("rejects unknown priorities", () => {
    expect(
      parseTriageResponse(
        '{"priority": "CRITICAL", "reason": "Bad day"}'
      )
    ).toBeNull();
  });

  it("rejects missing or empty reasons", () => {
    expect(parseTriageResponse('{"priority": "HIGH"}')).toBeNull();
    expect(
      parseTriageResponse('{"priority": "HIGH", "reason": "  "}')
    ).toBeNull();
  });

  it("rejects non-JSON chatter", () => {
    expect(
      parseTriageResponse("I think this is HIGH priority!")
    ).toBeNull();
    expect(parseTriageResponse("")).toBeNull();
  });
});
