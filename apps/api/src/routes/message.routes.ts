import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  create,
  getByTicket,
} from "../controllers/message.controller";


const router = Router();

router.post("/", authenticate, create);
router.get("/tickets/:ticketId", authenticate, getByTicket);

export default router;