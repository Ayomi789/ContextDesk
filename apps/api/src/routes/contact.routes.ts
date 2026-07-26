import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/contact.controller";

const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);

export default router;