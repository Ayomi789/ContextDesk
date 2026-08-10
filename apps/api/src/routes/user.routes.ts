import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getAllUsers } from "../controllers/user.controller";

const router = Router();

router.get("/", authenticate, getAllUsers);

export default router;