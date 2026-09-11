import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { triageTicket } from "./ai.service.js";
import { createTicket } from "./ticket.service.js";
import { createCustomerMessage } from "./message.service.js";

export interface IntakeInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
  startedAt?: number;
}

const MIN_FILL_MS = 2000;

export function isSpam(input: IntakeInput) {
  if (input.website && input.website.trim().length > 0) {
    return true;
  }

  if (
    typeof input.startedAt === "number" &&
    Date.now() - input.startedAt < MIN_FILL_MS
  ) {
    return true;
  }

  return false;
}

export async function getIntakeOrg(slug: string) {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!organization) {
    throw new ApiError(404, "Intake form not found");
  }

  return organization;
}

export async function submitIntake(
  slug: string,
  input: IntakeInput
) {
  const organization = await getIntakeOrg(slug);

  const email = input.email.toLowerCase();
  const organizationId = organization.id;

  let contact = await prisma.contact.findFirst({
    where: { email, organizationId },
  });

  if (!contact) {
    const accountDomain = `${slug}.intake.local`;

    let account = await prisma.account.findUnique({
      where: { domain: accountDomain },
    });

    if (!account) {
      account = await prisma.account.create({
        data: {
          name: "General",
          domain: accountDomain,
          tier: "General",
          organizationId,
        },
      });
    }

    contact = await prisma.contact.create({
      data: {
        name: input.name,
        email,
        accountId: account.id,
        organizationId,
      },
    });
  }

  // Nobody triages intake — the model does, before the SLA clock starts.
  const triage = await triageTicket(input.subject, input.message);

  const ticket = await createTicket(
    {
      subject: input.subject,
      contactId: contact.id,
      accountId: contact.accountId,
      priority: triage?.priority ?? "MEDIUM",
    },
    organizationId,
    { triageReason: triage?.reason }
  );

  await createCustomerMessage(
    {
      body: input.message,
      ticketId: ticket.id,
    },
    organizationId
  );

  const admins = await prisma.user.findMany({
    where: { organizationId, role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        title: "New intake ticket",
        description: `"${ticket.subject}" from ${contact.name}`,
        type: "INTAKE_TICKET",
        userId: admin.id,
        ticketId: ticket.id,
      })),
    });
  }

  return ticket;
}
