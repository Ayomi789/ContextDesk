import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { create } from "../controllers/ticket.controller";

const router = Router();

router.post("/", authenticate, create);

export default router;