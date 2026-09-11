import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_ORG_NAME = "Demo Workspace";
const DEMO_ORG_SLUG = "demo-workspace";

/**
 * Idempotent dev seed. Safe to re-run:
 * every write is an upsert or guarded by an existence check.
 * Everything lives in its own "Demo Workspace" org, so it never
 * mixes with real company data and deletes cleanly.
 *
 * Optional env:
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD — creates an ADMIN user
 *   in the demo org.
 *   SEED_DEMO=0 — skips the demo account/contact/ticket.
 */
async function main() {
  let org = await prisma.organization.findUnique({
    where: { slug: DEMO_ORG_SLUG },
  });

  if (!org && process.env.SEED_DEMO !== "0") {
    org = await prisma.organization.create({
      data: { name: DEMO_ORG_NAME, slug: DEMO_ORG_SLUG },
    });
    console.log("Seed demo org created");
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword && org) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: {
        name: "Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        emailVerified: true,
        organizationId: org.id,
      },
      select: { id: true, email: true, role: true },
    });

    console.log(`Seed admin: ${admin.email} (${admin.role})`);
  } else {
    console.log(
      "Seed admin skipped (set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD to create one)"
    );
  }

  if (process.env.SEED_DEMO === "0" || !org) {
    console.log("Seed demo data skipped");
    return;
  }

  const account = await prisma.account.upsert({
    where: { domain: "demo.example.com" },
    update: {},
    create: {
      name: "Demo Corp",
      domain: "demo.example.com",
      tier: "FREE",
      organizationId: org.id,
    },
  });

  const contact = await prisma.contact.upsert({
    where: { email: "demo-contact@example.com" },
    update: {},
    create: {
      name: "Demo Contact",
      email: "demo-contact@example.com",
      notes: "Seeded demo contact",
      accountId: account.id,
      organizationId: org.id,
    },
  });

  const ticketCount = await prisma.ticket.count({
    where: { accountId: account.id },
  });

  if (ticketCount === 0) {
    await prisma.ticket.create({
      data: {
        subject: "Welcome to ContextDesk",
        status: "NEW",
        priority: "MEDIUM",
        slaDueAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        contactId: contact.id,
        accountId: account.id,
        organizationId: org.id,
      },
    });

    console.log("Seed demo ticket created");
  } else {
    console.log("Seed demo ticket skipped (demo account already has tickets)");
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
