import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/require-role.js";
import {
  initialize,
  status,
  verify,
  webhook,
} from "../controllers/billing.controller.js";

const router = Router();

// Paystack signs the raw body — no auth, signature is the auth.
router.post("/webhook", webhook);

router.get("/status", authenticate, requireRole("ADMIN"), status);
router.post(
  "/initialize",
  authenticate,
  requireRole("ADMIN"),
  initialize
);
router.post("/verify", authenticate, requireRole("ADMIN"), verify);

export default router;
