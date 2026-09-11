import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/require-role.js";
import {
  create,
  getAll,
  preview,
  remove,
} from "../controllers/invitation.controller.js";

const router = Router();

// Public invite preview for the signup page.
router.get("/:id", preview);

router.get("/", authenticate, requireRole("ADMIN"), getAll);
router.post("/", authenticate, requireRole("ADMIN"), create);
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  remove
);

export default router;
