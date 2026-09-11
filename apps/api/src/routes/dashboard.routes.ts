import { Router } from "express";
import {
  getDashboard,
  getDashboardSlaTickets,
} from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getDashboard);
router.get("/sla", authenticate, getDashboardSlaTickets);



export default router;