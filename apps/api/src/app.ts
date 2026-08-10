import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import protectedRoutes from "./routes/protected.routes";
import accountRoutes from "./routes/account.routes";
import ticketRoutes from "./routes/ticket.routes";

import { notFound } from "./middleware/not-found";
import { errorHandler } from "./middleware/error-handler";
import contactRoutes from "./routes/contact.routes";
import messageRoutes from "./routes/message.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import aiRoutes from "./routes/ai.routes";
import userRoutes from "./routes/user.routes";
import notificationRoutes from "./routes/notification.routes";



const app = express();

app.use(cors());
app.use(express.json());

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
// 404 handler
app.use(notFound);

// ✅ Error handler MUST be last
app.use(errorHandler);

export default app;