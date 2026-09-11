import crypto from "node:crypto";
import { ApiError } from "../utils/api-error.js";

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY || "";

  if (!key) {
    throw new ApiError(500, "Billing is not configured");
  }

  return key;
}

async function paystackFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(20000),
  });

  const data = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: any;
  } | null;

  if (!response.ok || !data?.status) {
    throw new ApiError(
      502,
      `Paystack error: ${data?.message || response.statusText}`
    );
  }

  return data.data;
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined
) {
  if (!signature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(digest);
  const b = Buffer.from(signature);

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

export async function initializeSubscription(input: {
  email: string;
  amountKobo: number;
  planCode: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}) {
  return paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      plan: input.planCode,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  }) as Promise<{ authorization_url: string; reference: string }>;
}

export async function verifyTransaction(reference: string) {
  return paystackFetch(`/transaction/verify/${reference}`, {
    method: "GET",
  }) as Promise<{
    status: string;
    customer: { customer_code: string; email: string };
    plan?: { plan_code: string };
    metadata?: Record<string, string>;
  }>;
}

export async function fetchSubscription(subscriptionCode: string) {
  return paystackFetch(`/subscription/${subscriptionCode}`, {
    method: "GET",
  }) as Promise<{
    status: string;
    next_payment_date?: string;
    customer?: { customer_code: string };
    plan?: { plan_code: string };
  }>;
}
