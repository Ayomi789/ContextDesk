import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { PLANS, planPaystackCode, type PlanId } from "../config/plans.js";
import {
  fetchSubscription,
  initializeSubscription,
  verifyTransaction,
  verifyWebhookSignature,
} from "./paystack.service.js";

export interface Usage {
  seatsUsed: number;
  seatsLimit: number | null;
  ticketsThisMonth: number;
  ticketsLimit: number | null;
}

export async function getSubscription(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  return (
    subscription ?? {
      plan: "FREE" as const,
      status: "TRIALING" as const,
      organizationId,
    }
  );
}

export function effectivePlan(subscription: {
  plan: string;
  status: string;
}): PlanId {
  if (
    subscription.status === "PAST_DUE" ||
    subscription.status === "CANCELED"
  ) {
    return "FREE";
  }

  return (Object.keys(PLANS) as PlanId[]).includes(
    subscription.plan as PlanId
  )
    ? (subscription.plan as PlanId)
    : "FREE";
}

export async function getUsage(
  organizationId: string
): Promise<Usage> {
  const subscription = await getSubscription(organizationId);
  const plan = PLANS[effectivePlan(subscription)];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [seatsUsed, ticketsThisMonth] = await Promise.all([
    prisma.user.count({ where: { organizationId } }),
    prisma.ticket.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    seatsUsed,
    seatsLimit: plan.seats,
    ticketsThisMonth,
    ticketsLimit: plan.ticketsPerMonth,
  };
}

export function frontendBase() {
  const first = process.env.FRONTEND_URL || "";

  return first.split(",")[0]?.trim() || "http://localhost:5515";
}

export async function initializeCheckout(
  organizationId: string,
  userId: string,
  plan: PlanId
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userEmail = user.email;
  if (plan !== "STARTER" && plan !== "PRO") {
    throw new ApiError(
      400,
      "Contact sales for Enterprise billing"
    );
  }

  const subscription = await getSubscription(organizationId);

  if (
    subscription.plan === plan &&
    "status" in subscription &&
    subscription.status === "ACTIVE"
  ) {
    throw new ApiError(400, "Already on this plan");
  }

  // Amount is illustrative until plan amounts are set in Paystack;
  // the Paystack plan object owns the real price.
  const { authorization_url, reference } = await initializeSubscription({
    email: userEmail,
    amountKobo: 100,
    planCode: planPaystackCode(plan),
    callbackUrl: `${frontendBase()}/billing/callback`,
    metadata: { organizationId, plan },
  });

  return { authorization_url, reference };
}

export async function confirmReference(
  organizationId: string,
  reference: string
) {
  const txn = await verifyTransaction(reference);

  if (txn.status !== "success") {
    throw new ApiError(400, "Payment was not successful");
  }

  if (txn.metadata?.organizationId !== organizationId) {
    throw new ApiError(403, "Payment does not belong to this workspace");
  }

  // Plan comes from our own metadata first (we stamp it at initialize);
  // Paystack's transaction object often carries no plan at all.
  const metaPlan = txn.metadata?.plan as string | undefined;
  const plan =
    (Object.keys(PLANS) as PlanId[]).find((p) => p === metaPlan) ??
    (Object.keys(PLANS) as PlanId[]).find((p) => {
      try {
        return planPaystackCode(p) === txn.plan?.plan_code;
      } catch {
        return false;
      }
    });

  if (!plan) {
    throw new ApiError(400, "Unknown plan in payment");
  }

  let subscriptionCode: string | undefined;
  let currentPeriodEnd: Date | undefined;
  try {
    const sub = await fetchSubscription(reference);
    subscriptionCode = reference;
    if (sub.next_payment_date) {
      currentPeriodEnd = new Date(sub.next_payment_date);
    }
  } catch {
    // Reference may be a transaction, not a subscription code.
  }

  return prisma.subscription.upsert({
    where: { organizationId },
    update: {
      plan,
      status: "ACTIVE",
      paystackCustomerCode: txn.customer.customer_code,
      ...(subscriptionCode
        ? { paystackSubscriptionCode: subscriptionCode }
        : {}),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    },
    create: {
      plan,
      status: "ACTIVE",
      paystackCustomerCode: txn.customer.customer_code,
      ...(subscriptionCode
        ? { paystackSubscriptionCode: subscriptionCode }
        : {}),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      organizationId,
    },
  });
}

export async function handleWebhook(
  rawBody: Buffer,
  signature: string | undefined,
  event: { event?: string; data?: any }
) {
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new ApiError(401, "Invalid webhook signature");
  }

  const data = event.data ?? {};

  if (event.event === "subscription.create") {
    const customerCode: string | undefined =
      data.customer?.customer_code;
    const subscriptionCode: string | undefined = data.subscription_code;

    if (!customerCode) {
      return { ignored: true };
    }

    const existing = await prisma.subscription.findFirst({
      where: { paystackCustomerCode: customerCode },
    });

    if (!existing) {
      return { ignored: true };
    }

    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        ...(subscriptionCode ? { paystackSubscriptionCode: subscriptionCode } : {}),
        ...(data.next_payment_date
          ? { currentPeriodEnd: new Date(data.next_payment_date) }
          : {}),
      },
    });

    return { updated: true };
  }

  if (
    event.event === "invoice.payment_failed" ||
    event.event === "subscription.not_renew"
  ) {
    const subscriptionCode: string | undefined =
      data.subscription?.subscription_code ?? data.subscription_code;

    if (!subscriptionCode) {
      return { ignored: true };
    }

    await prisma.subscription.updateMany({
      where: { paystackSubscriptionCode: subscriptionCode },
      data: {
        status:
          event.event === "invoice.payment_failed"
            ? "PAST_DUE"
            : "CANCELED",
      },
    });

    return { updated: true };
  }

  if (event.event === "subscription.disable") {
    const subscriptionCode: string | undefined = data.subscription_code;

    if (!subscriptionCode) {
      return { ignored: true };
    }

    await prisma.subscription.updateMany({
      where: { paystackSubscriptionCode: subscriptionCode },
      data: { status: "CANCELED", plan: "FREE" },
    });

    return { updated: true };
  }

  return { ignored: true };
}

export async function checkSeatLimit(organizationId: string) {
  const [subscription, seatsUsed] = await Promise.all([
    getSubscription(organizationId),
    prisma.user.count({ where: { organizationId } }),
  ]);

  const plan = PLANS[effectivePlan(subscription)];

  if (plan.seats !== null && seatsUsed >= plan.seats) {
    throw new ApiError(
      402,
      `Seat limit reached (${plan.seats}). Upgrade to add more teammates.`
    );
  }
}

export async function checkTicketLimit(organizationId: string) {
  const subscription = await getSubscription(organizationId);
  const plan = PLANS[effectivePlan(subscription)];

  if (plan.ticketsPerMonth === null) {
    return;
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.ticket.count({
    where: {
      organizationId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (count >= plan.ticketsPerMonth) {
    throw new ApiError(
      402,
      `Monthly ticket limit reached (${plan.ticketsPerMonth}). Upgrade for more.`
    );
  }
}
