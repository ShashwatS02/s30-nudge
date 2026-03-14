import { Router, type Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

export default router;
