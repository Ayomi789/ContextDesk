/* import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { create } from "../controllers/account.controller";

const router = Router();

router.post("/", authenticate, create);

export default router; */

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/account.controller";

const router = Router();


router.get("/", authenticate, getAll);
router.post("/", authenticate, create);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);


export default router;