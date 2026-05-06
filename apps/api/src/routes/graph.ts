import { Router } from "express";
import type { LinkIndex } from "../services/linkIndex.js";

export function graphRouter(index: LinkIndex): Router {
  const router = Router();

  router.get("/graph", (_req, res) => {
    res.json(index.buildGraph());
  });

  return router;
}
