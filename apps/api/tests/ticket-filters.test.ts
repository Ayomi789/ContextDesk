import { describe, expect, it } from "vitest";
import { getTickets } from "../src/services/ticket.service";

describe("getTickets filter validation", () => {
  it("rejects an unknown status with 400", async () => {
    await expect(
      getTickets({ status: "BOGUS" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects an unknown priority with 400", async () => {
    await expect(
      getTickets({ priority: "NOPE" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
