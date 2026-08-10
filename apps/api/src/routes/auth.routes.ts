// import { Router } from "express";
// // import { register } from "../controllers/auth.controller";
// import { login, register } from "../controllers/auth.controller";


// const router = Router();

// router.post("/register", register);
// router.post("/login", login);

// export default router;

import { Router } from "express";
import {
  login,
  register,
  me,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

export default router;