import { env } from "../config/env";

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
        model: "meta/llama-3.1-8b-instruct",
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