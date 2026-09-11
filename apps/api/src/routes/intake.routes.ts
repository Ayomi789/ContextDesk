import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { preview, submit } from "../controllers/intake.controller.js";

const router = Router();

const intakeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, try again later",
  },
});

router.get("/:slug", preview);
router.post("/:slug", intakeLimiter, submit);

export default router;
