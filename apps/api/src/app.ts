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
// 404 handler
app.use(notFound);

// ✅ Error handler MUST be last
app.use(errorHandler);

export default app;