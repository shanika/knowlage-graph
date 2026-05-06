import { Router } from "express";
import { config } from "../config.js";
import { buildTree } from "../services/vault.js";

export const treeRouter: Router = Router();

treeRouter.get("/tree", async (_req, res, next) => {
  try {
    const tree = await buildTree(config.vaultPath);
    res.json(tree);
  } catch (err) {
    next(err);
  }
});
