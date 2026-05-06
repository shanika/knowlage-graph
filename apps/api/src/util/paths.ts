import path from "node:path";

// Convert any path on disk into a vault-relative, forward-slash path.
export function toVaultPath(absPath: string, vaultRoot: string): string {
  const rel = path.relative(vaultRoot, absPath);
  return rel.split(path.sep).join("/");
}

// Resolve a vault-relative path back to an absolute path, refusing anything
// that would escape the vault root.
export function safeResolve(vaultPath: string, vaultRoot: string): string {
  const normalized = vaultPath.replace(/^\/+/, "");
  const abs = path.resolve(vaultRoot, normalized);
  const rel = path.relative(vaultRoot, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Path escapes vault root: ${vaultPath}`);
  }
  return abs;
}
