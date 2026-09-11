import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getAll,
  getPrefs,
  markRead,
  markAllRead,
  updatePrefs,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authenticate, getAll);
router.get("/preferences", authenticate, getPrefs);
router.patch("/preferences", authenticate, updatePrefs);
router.patch("/:id/read", authenticate, markRead);
router.patch("/read-all", authenticate, markAllRead);

export default router;