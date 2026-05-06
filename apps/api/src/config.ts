import { existsSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const apiRoot = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(apiRoot, "../../../.env") });

function expandTilde(p: string): string {
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

const rawVault = process.env.VAULT_PATH ?? "../../vault";
const vaultPath = path.resolve(process.cwd(), expandTilde(rawVault));

if (!existsSync(vaultPath) || !statSync(vaultPath).isDirectory()) {
  throw new Error(
    `VAULT_PATH does not point to an existing directory: ${vaultPath}`
  );
}

const portRaw = process.env.API_PORT ?? "4000";
const port = Number.parseInt(portRaw, 10);
if (Number.isNaN(port)) {
  throw new Error(`API_PORT is not a valid integer: ${portRaw}`);
}

export const config = {
  vaultPath,
  port,
};
