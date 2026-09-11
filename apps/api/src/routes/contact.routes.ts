import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/require-role.js";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/contact.controller.js";

const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, requireRole("ADMIN"), remove);

export default router;