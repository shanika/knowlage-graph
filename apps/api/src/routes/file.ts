import { Router } from "express";
import type { LinkIndex } from "../services/linkIndex.js";

export function fileRouter(index: LinkIndex): Router {
  const router = Router();

  router.get("/file", (req, res) => {
    const raw = req.query.path;
    if (typeof raw !== "string" || raw.length === 0) {
      res.status(400).json({ error: "path query param required" });
      return;
    }
    const normalized = raw.replace(/^\/+/, "");
    const doc = index.getDoc(normalized);
    if (!doc) {
      res.status(404).json({ error: `not found: ${normalized}` });
      return;
    }
    res.json(doc);
  });

  return router;
}
