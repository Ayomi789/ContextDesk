import { TicketPriority } from "@prisma/client";
import { env } from "../config/env.js";

const AI_MODEL =
  process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-30b-a3b";

const TRIAGE_PRIORITIES: TicketPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export interface Triage {
  priority: TicketPriority;
  reason: string;
}

/**
 * Parse a model reply into a Triage. Returns null for
 * anything that isn't exactly the contract (fences tolerated).
 */
export function parseTriageResponse(text: string): Triage | null {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("priority" in parsed) ||
    !("reason" in parsed)
  ) {
    return null;
  }

  const { priority, reason } = parsed as {
    priority: unknown;
    reason: unknown;
  };

  if (
    typeof priority !== "string" ||
    !TRIAGE_PRIORITIES.includes(priority as TicketPriority) ||
    typeof reason !== "string" ||
    reason.trim().length === 0 ||
    reason.length > 200
  ) {
    return null;
  }

  return {
    priority: priority as TicketPriority,
    reason: reason.trim(),
  };
}

/**
 * Classify a complaint's urgency. Returns null when the model is
 * unreachable, misconfigured, or answers off-contract — callers
 * must fall back to MEDIUM.
 */
export async function triageTicket(
  subject: string,
  message: string
): Promise<Triage | null> {
  if (!env.NVIDIA_API_KEY) {
    return null;
  }

  const prompt = `Classify the urgency of this customer support request.

Subject: ${subject}
Message: ${message}

Rules:
- URGENT: outage, data loss, security issue, payment blocked, customer cannot work at all.
- HIGH: major feature broken, urgent deadline, many users affected.
- MEDIUM: general problem, question, or minor malfunction with a workaround.
- LOW: how-to question, feedback, cosmetic issue.
- When unsure, choose MEDIUM.

Reply with ONLY this JSON, no other text:
{"priority": "LOW|MEDIUM|HIGH|URGENT", "reason": "one short sentence"}`;

  let response: Response;
  try {
    response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You classify support ticket urgency. You reply only with JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0,
          max_tokens: 150,
        }),
        signal: AbortSignal.timeout(20000),
      }
    );
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  let data: {
    choices?: {
      message?: {
        content?: string;
      };
    }[];
  };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    return null;
  }

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return null;
  }

  return parseTriageResponse(content);
}

export async function generateTicketDraft(input: {
  subject: string;
  status: string;
  priority: string;
  contactName?: string;
  accountName?: string;
  messages: {
    body: string;
    isInternalNote: boolean;
    authorName?: string;
  }[];
}) {
  if (!env.NVIDIA_API_KEY) {
    throw new Error("NVIDIA API key is not configured");
  }

  const conversation = input.messages
    .filter((message) => !message.isInternalNote)
    .map(
      (message) =>
        `${message.authorName || "Customer/Agent"}: ${message.body}`
    )
    .join("\n");

  const prompt = `
You are a professional customer support agent.

Write a helpful, concise reply to the customer based on the ticket information below.

Ticket subject: ${input.subject}
Status: ${input.status}
Priority: ${input.priority}
Contact: ${input.contactName || "Unknown"}
Account: ${input.accountName || "Unknown"}

Conversation:
${conversation || "No previous customer messages."}

Rules:
- Be professional and friendly.
- Directly address the customer's issue.
- Do not invent facts, policies, refunds, timelines, or actions that are not present in the conversation.
- Do not mention that you are an AI.
- Return only the draft reply, without labels or quotation marks.
`;

  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a professional customer support assistant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `NVIDIA API request failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    choices?: {
      message?: {
        content?: string;
      };
    }[];
  };

  const draft = data.choices?.[0]?.message?.content?.trim();

  if (!draft) {
    throw new Error("NVIDIA returned an empty draft");
  }

  return draft;
}