/* import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { create } from "../controllers/account.controller";

const router = Router();

router.post("/", authenticate, create);

export default router; */

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { create } from "../controllers/account.controller";

const router = Router();

router.post("/", authenticate, create);

export default router;