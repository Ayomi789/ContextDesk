import { describe, expect, it } from "vitest";
import { TicketStatus } from "@prisma/client";
import { getSlaStatus } from "../src/services/ticket.service";

const HOUR = 60 * 60 * 1000;

describe("getSlaStatus", () => {
  it("returns RESOLVED for resolved tickets regardless of deadline", () => {
    const past = new Date(Date.now() - HOUR);

    expect(getSlaStatus(past, TicketStatus.RESOLVED)).toBe(
      "RESOLVED"
    );
    expect(
      getSlaStatus(null, TicketStatus.RESOLVED)
    ).toBe("RESOLVED");
  });

  it("returns NO_SLA when no deadline exists", () => {
    expect(getSlaStatus(null, TicketStatus.NEW)).toBe(
      "NO_SLA"
    );
  });

  it("returns BREACHED when the deadline has passed", () => {
    const past = new Date(Date.now() - 1000);

    expect(getSlaStatus(past, TicketStatus.NEW)).toBe(
      "BREACHED"
    );
  });

  it("returns AT_RISK within the 2-hour window", () => {
    const soon = new Date(Date.now() + 90 * 60 * 1000);

    expect(getSlaStatus(soon, TicketStatus.NEW)).toBe(
      "AT_RISK"
    );
  });

  it("returns WITHIN_SLA when more than 2 hours remain", () => {
    const later = new Date(Date.now() + 3 * HOUR);

    expect(
      getSlaStatus(later, TicketStatus.IN_PROGRESS)
    ).toBe("WITHIN_SLA");
  });
});
