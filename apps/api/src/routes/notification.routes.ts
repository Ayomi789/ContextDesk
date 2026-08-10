import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getAll,
  markRead,
  markAllRead,
} from "../controllers/notification.controller";

const router = Router();

router.get("/", authenticate, getAll);
router.patch("/:id/read", authenticate, markRead);
router.patch("/read-all", authenticate, markAllRead);

export default router;