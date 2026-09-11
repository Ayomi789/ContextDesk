import bcrypt from "bcrypt";
import { randomBytes, randomInt } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  GoogleAuthInput,
  LoginInput,
  RegisterInput,
  VerifyEmailInput,
} from "../validators/auth.validator.js";
import { ApiError } from "../utils/api-error.js";
import { generateToken } from "../utils/jwt.js";
import { sendVerificationCode } from "./mail.service.js";
import { consumeInvitation } from "./invitation.service.js";

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

function newVerificationCode() {
  return String(randomInt(100000, 1000000));
}

function issueToken(user: {
  id: string;
  role: string;
  organizationId: string;
}) {
  return generateToken({
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
  });
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}

async function resolveOrganization(
  data: {
    organizationName?: string;
    inviteToken?: string;
  },
  email: string
) {
  if (data.organizationName && data.inviteToken) {
    throw new ApiError(
      400,
      "Provide only one of organizationName or inviteToken"
    );
  }

  if (data.inviteToken) {
    const separator = data.inviteToken.indexOf(".");

    if (separator <= 0) {
      throw new ApiError(400, "Invalid invitation");
    }

    const accepted = await consumeInvitation(
      data.inviteToken.slice(0, separator),
      data.inviteToken.slice(separator + 1),
      email
    );

    return {
      organizationId: accepted.organizationId,
      role: accepted.role as "ADMIN" | "AGENT",
    };
  }

  if (data.organizationName) {
    const organization = await createOrganizationWithSlug(
      data.organizationName
    );

    return {
      organizationId: organization.id,
      role: "ADMIN" as const,
    };
  }

  throw new ApiError(
    400,
    "organizationName or inviteToken is required"
  );
}

function slugifyOrganization(name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org";

  return `${base}-${randomBytes(3).toString("hex")}`;
}

async function createOrganizationWithSlug(name: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.organization.create({
        data: { name, slug: slugifyOrganization(name) },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new ApiError(500, "Could not create organization");
}

export async function googleAuth(data: GoogleAuthInput) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    throw new ApiError(500, "Google sign-in is not configured");
  }

  let payload;
  try {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: data.idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Invalid Google credential");
  }

  const email = payload?.email?.toLowerCase();

  if (!payload || !email || payload.email_verified !== true) {
    throw new ApiError(401, "Google account email is not verified");
  }

  const googleId = payload.sub;
  const name =
    payload.name || email.split("@")[0] || "Google User";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.googleId && existing.googleId !== googleId) {
      throw new ApiError(
        401,
        "This email is linked to a different Google account"
      );
    }

    const user = existing.googleId
      ? existing
      : await prisma.user.update({
          where: { id: existing.id },
          data: { googleId, emailVerified: true },
        });

    const verified =
      user.emailVerified === false
        ? await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
          })
        : user;

    return {
      token: issueToken(verified),
      user: publicUser(verified),
    };
  }

  const { organizationId, role } = await resolveOrganization(
    data,
    email
  );

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: null,
      googleId,
      role,
      organizationId,
      emailVerified: true,
    },
  });

  return {
    token: issueToken(user),
    user: publicUser(user),
  };
}

export async function registerUser(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const { organizationId, role } = await resolveOrganization(
    data,
    data.email
  );

  const passwordHash = await bcrypt.hash(data.password, 10);
  const code = newVerificationCode();

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role,
      organizationId,
      emailVerified: false,
      verificationCodeHash: await bcrypt.hash(code, 10),
      verificationCodeExpiresAt: new Date(
        Date.now() + VERIFICATION_TTL_MS
      ),
    },
  });

  await sendVerificationCode(user.email, user.name, code);

  return {
    user: publicUser(user),
  };
}

export async function verifyEmail(data: VerifyEmailInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or code");
  }

  if (user.emailVerified) {
    return {
      token: issueToken(user),
      user: publicUser(user),
    };
  }

  if (
    !user.verificationCodeHash ||
    !user.verificationCodeExpiresAt ||
    user.verificationCodeExpiresAt.getTime() < Date.now()
  ) {
    throw new ApiError(
      400,
      "Code expired, request a new one"
    );
  }

  const codeMatches = await bcrypt.compare(
    data.code,
    user.verificationCodeHash
  );

  if (!codeMatches) {
    throw new ApiError(401, "Invalid email or code");
  }

  const verified = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
    },
  });

  return {
    token: issueToken(verified),
    user: publicUser(verified),
  };
}

export async function resendVerificationCode(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.emailVerified) {
    throw new ApiError(400, "Email already verified");
  }

  const code = newVerificationCode();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCodeHash: await bcrypt.hash(code, 10),
      verificationCodeExpiresAt: new Date(
        Date.now() + VERIFICATION_TTL_MS
      ),
    },
  });

  await sendVerificationCode(user.email, user.name, code);
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.passwordHash) {
    throw new ApiError(
      401,
      "This account uses Google sign-in"
    );
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.emailVerified) {
    throw new ApiError(401, "Please verify your email");
  }

  const token = issueToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}