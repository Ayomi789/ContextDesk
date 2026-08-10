import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  create,
  createCustomer,
  getByTicket,
} from "../controllers/message.controller";

const router = Router();

router.post("/", authenticate, create);
router.post("/customer", authenticate, createCustomer);
router.get("/tickets/:ticketId", authenticate, getByTicket);

export default router;