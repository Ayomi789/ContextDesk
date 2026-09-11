import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/require-role.js";
import {
  getAllUsers,
  removeMe,
  updateMe,
  updateMyPassword,
  updateRole,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", authenticate, getAllUsers);
router.patch("/me", authenticate, updateMe);
router.delete("/me", authenticate, removeMe);
router.patch(
  "/me/password",
  authenticate,
  updateMyPassword
);
router.patch(
  "/:id/role",
  authenticate,
  requireRole("ADMIN"),
  updateRole
);

export default router;