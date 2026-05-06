import chokidar from "chokidar";
import path from "node:path";
import { toVaultPath } from "../util/paths.js";
import type { LinkIndex } from "./linkIndex.js";

export function startWatcher(vaultRoot: string, index: LinkIndex): void {
  const watcher = chokidar.watch(vaultRoot, {
    ignoreInitial: true,
    ignored: (p) => /(^|[\\/])\.[^\\/]/.test(p),
  });

  watcher.on("add", async (abs) => {
    if (!abs.toLowerCase().endsWith(".md")) return;
    const rel = toVaultPath(abs, vaultRoot);
    await index.onAdd(rel);
    console.log(`[watcher] added ${rel}`);
  });

  watcher.on("change", async (abs) => {
    if (!abs.toLowerCase().endsWith(".md")) return;
    const rel = toVaultPath(abs, vaultRoot);
    await index.onChange(rel);
    console.log(`[watcher] changed ${rel}`);
  });

  watcher.on("unlink", (abs) => {
    if (!abs.toLowerCase().endsWith(".md")) return;
    const rel = toVaultPath(abs, vaultRoot);
    index.onUnlink(rel);
    console.log(`[watcher] removed ${rel}`);
  });

  watcher.on("error", (err) => {
    console.error("[watcher] error", err);
  });
}
