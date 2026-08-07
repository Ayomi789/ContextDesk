import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ContextDesk API",
    version: "1.0.0",
  });
});

export default router;