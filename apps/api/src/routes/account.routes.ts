import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/require-role.js";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/account.controller.js";

const router = Router();


router.get("/", authenticate, getAll);
router.post("/", authenticate, create);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, requireRole("ADMIN"), remove);


export default router;