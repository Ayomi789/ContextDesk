import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { RegisterInput } from "../validators/auth.validator";
import { ApiError } from "../utils/api-error";
import { LoginInput } from "../validators/auth.validator";
import { generateToken } from "../utils/jwt";



export async function registerUser(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
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

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      
    });

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