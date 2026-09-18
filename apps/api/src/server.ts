import app from "./app.js";
import { env } from "./config/env.js";
import { ensureDbConnected } from "./lib/prisma.js";

async function start() {
  await ensureDbConnected();
  console.log("✅ Database connected");

  app.listen(env.PORT, () => {
    console.log(
      `🚀 ContextDesk API running on http://localhost:${env.PORT}`
    );
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});