import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  google,
  login,
  register,
  resendCode,
  verify,
  me,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

function authLimiter(max: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many attempts, try again later",
    },
  });
}

const router = Router();

router.post(
  "/register",
  authLimiter(30),
  register
);
router.post("/login", authLimiter(30), login);
router.post("/google", authLimiter(30), google);
router.post("/verify", authLimiter(30), verify);
router.post(
  "/resend-code",
  authLimiter(10),
  resendCode
);
router.get("/me", authenticate, me);

export default router;