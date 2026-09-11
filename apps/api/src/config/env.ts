import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 5011,
  NODE_ENV: process.env.NODE_ENV || "development",

  DATABASE_URL: requireEnv("DATABASE_URL"),

  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || "",

  FRONTEND_URLS: (process.env.FRONTEND_URL || "http://localhost:5515,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};