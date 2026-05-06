import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { config } from "./config.js";
import { LinkIndex } from "./services/linkIndex.js";
import { startWatcher } from "./services/watcher.js";
import { treeRouter } from "./routes/tree.js";
import { fileRouter } from "./routes/file.js";
import { graphRouter } from "./routes/graph.js";

async function main(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const index = new LinkIndex(config.vaultPath);
  await index.rebuild();
  startWatcher(config.vaultPath, index);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, vault: config.vaultPath });
  });
  app.use("/api", treeRouter);
  app.use("/api", fileRouter(index));
  app.use("/api", graphRouter(index));

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  };
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`api listening on http://localhost:${config.port}`);
    console.log(`vault: ${config.vaultPath}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
