import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import protectedRoutes from "./routes/protected.routes";
import accountRoutes from "./routes/account.routes";

import { notFound } from "./middleware/not-found";
import { errorHandler } from "./middleware/error-handler";

const app = express();

app.use(cors());
app.use(express.json());

// API v1 routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/accounts", accountRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/protected", protectedRoutes);
// 404 handler
app.use(notFound);

// ✅ Error handler MUST be last
app.use(errorHandler);

export default app;