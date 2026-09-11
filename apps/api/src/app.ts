import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import accountRoutes from "./routes/account.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";

import { env } from "./config/env.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import contactRoutes from "./routes/contact.routes.js";
import messageRoutes from "./routes/message.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import intakeRoutes from "./routes/intake.routes.js";



const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: env.FRONTEND_URLS,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

// API v1 routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/accounts", accountRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/protected", protectedRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/ai-draft", aiRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/invitations", invitationRoutes);
app.use("/api/v1/intake", intakeRoutes);
// 404 handler
app.use(notFound);

// ✅ Error handler MUST be last
app.use(errorHandler);

export default app;