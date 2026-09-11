import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import type { UserRole } from "@contextdesk/shared-types";
import { sendInvitation } from "./mail.service.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function frontendBase() {
  const first = process.env.FRONTEND_URL || "";

  return first.split(",")[0]?.trim() || "http://localhost:5515";
}

export async function createInvitation(
  organizationId: string,
  createdById: string,
  data: { email: string; role?: UserRole }
) {
  const email = data.email.toLowerCase();
  const role = data.role ?? "AGENT";

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (
    existingUser &&
    existingUser.organizationId === organizationId
  ) {
    throw new ApiError(
      409,
      "User is already a member of this organization"
    );
  }

  const token = randomBytes(32).toString("hex");

  const invitation = await prisma.invitation.create({
    data: {
      email,
      role,
      tokenHash: await bcrypt.hash(token, 10),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      organizationId,
      createdById,
    },
    include: {
      organization: {
        select: { name: true },
      },
    },
  });

  const inviteLink = `${frontendBase()}/login?invite=${invitation.id}.${token}`;

  await sendInvitation(
    email,
    invitation.organization.name,
    inviteLink
  );

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    // Shown once: the secret is hashed afterwards.
    inviteLink,
  };
}

export async function listInvitations(organizationId: string) {
  return prisma.invitation.findMany({
    where: {
      organizationId,
      acceptedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function revokeInvitation(
  organizationId: string,
  id: string
) {
  const invitation = await prisma.invitation.findFirst({
    where: { id, organizationId },
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  await prisma.invitation.delete({
    where: { id },
  });
}

/**
 * Public invite preview for the signup page.
 * Exposes only what a stranger needs: org name + email.
 */
export async function getInvitationPreview(id: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    include: {
      organization: {
        select: { name: true },
      },
    },
  });

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt.getTime() < Date.now()
  ) {
    throw new ApiError(404, "Invitation not found or expired");
  }

  return {
    email: invitation.email,
    organizationName: invitation.organization.name,
  };
}

export async function consumeInvitation(
  invitationId: string,
  token: string,
  email: string
) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt.getTime() < Date.now() ||
    invitation.email !== email.toLowerCase()
  ) {
    throw new ApiError(400, "Invalid or expired invitation");
  }

  const tokenMatches = await bcrypt.compare(
    token,
    invitation.tokenHash
  );

  if (!tokenMatches) {
    throw new ApiError(400, "Invalid or expired invitation");
  }

  const accepted = await prisma.invitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  return accepted;
}
