import express from "express";
import cors from "cors";

import { notFound } from "./middleware/not-found";
import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./middleware/error-handler";

const app = express();

app.use(cors());
app.use(express.json());
app.use(errorHandler);

// API v1 routes
app.use("/api/v1/health", healthRoutes);

// 404 handler (always LAST)
app.use(notFound);

export default app;