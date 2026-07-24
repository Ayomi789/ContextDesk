import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 5011,
  NODE_ENV: process.env.NODE_ENV || "development",
};