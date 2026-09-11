import { ApiError } from "../utils/api-error.js";

export type PlanId = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export interface PlanLimits {
  seats: number | null;
  ticketsPerMonth: number | null;
}

export const PLANS: Record<
  PlanId,
  PlanLimits & { label: string; paystackPlanEnv: string | null }
> = {
  FREE: {
    label: "Free",
    seats: 3,
    ticketsPerMonth: 100,
    paystackPlanEnv: null,
  },
  STARTER: {
    label: "Starter",
    seats: 10,
    ticketsPerMonth: 10000,
    paystackPlanEnv: "PAYSTACK_PLAN_STARTER",
  },
  PRO: {
    label: "Pro",
    seats: null,
    ticketsPerMonth: null,
    paystackPlanEnv: "PAYSTACK_PLAN_PRO",
  },
  ENTERPRISE: {
    label: "Enterprise",
    seats: null,
    ticketsPerMonth: null,
    paystackPlanEnv: null,
  },
};

export function planPaystackCode(plan: PlanId): string {
  const envName = PLANS[plan].paystackPlanEnv;

  if (!envName) {
    throw new ApiError(400, `Plan ${plan} has no online checkout`);
  }

  const code = process.env[envName];

  if (!code) {
    throw new ApiError(
      500,
      "Billing is not configured — set the Paystack plan code"
    );
  }

  return code;
}
