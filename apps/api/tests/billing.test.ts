import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

process.env.PAYSTACK_SECRET_KEY = "test-secret-for-webhook-unit";

const { handleWebhook } = await import(
  "../src/services/billing.service.js"
);
const { prisma } = await import("../src/lib/prisma.js");

vi.spyOn(prisma.subscription, "findFirst").mockResolvedValue(null);

function sign(body: string) {
  return crypto
    .createHmac("sha512", "test-secret-for-webhook-unit")
    .update(Buffer.from(body))
    .digest("hex");
}

describe("billing webhook", () => {
  it("rejects bad signatures with 401", async () => {
    const body = JSON.stringify({
      event: "subscription.create",
      data: {},
    });

    await expect(
      handleWebhook(Buffer.from(body), "bogus", JSON.parse(body))
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("ignores unknown customers without error", async () => {
    const body = JSON.stringify({
      event: "subscription.create",
      data: { customer: { customer_code: "CUS_nope" } },
    });

    await expect(
      handleWebhook(Buffer.from(body), sign(body), JSON.parse(body))
    ).resolves.toEqual({ ignored: true });
  });
});
