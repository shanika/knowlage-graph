import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { FileNode } from "@llm-wiki-viz/shared";
import { toVaultPath } from "../util/paths.js";

const IGNORED_DIRS = new Set([".git", "node_modules", ".obsidian", ".vscode"]);

export async function buildTree(vaultRoot: string): Promise<FileNode> {
  return walk(vaultRoot, vaultRoot, path.basename(vaultRoot));
}

async function walk(
  absPath: string,
  vaultRoot: string,
  name: string
): Promise<FileNode> {
  const entries = await readdir(absPath, { withFileTypes: true });
  const children: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".env.example") continue;
    if (IGNORED_DIRS.has(entry.name)) continue;
    const childAbs = path.join(absPath, entry.name);
    if (entry.isDirectory()) {
      const subtree = await walk(childAbs, vaultRoot, entry.name);
      if (subtree.children && subtree.children.length > 0) {
        children.push(subtree);
      }
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      children.push({
        name: entry.name,
        path: toVaultPath(childAbs, vaultRoot),
        type: "file",
      });
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    name,
    path: toVaultPath(absPath, vaultRoot) || "/",
    type: "directory",
    children,
  };
}

// Flat list of every markdown file (vault-relative paths).
export async function listMarkdownFiles(vaultRoot: string): Promise<string[]> {
  const out: string[] = [];
  await walkFlat(vaultRoot, vaultRoot, out);
  return out;
}

async function walkFlat(
  absPath: string,
  vaultRoot: string,
  out: string[]
): Promise<void> {
  const entries = await readdir(absPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;
    const childAbs = path.join(absPath, entry.name);
    if (entry.isDirectory()) {
      await walkFlat(childAbs, vaultRoot, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      out.push(toVaultPath(childAbs, vaultRoot));
    }
  }
}

export async function fileExists(absPath: string): Promise<boolean> {
  try {
    const s = await stat(absPath);
    return s.isFile();
  } catch {
    return false;
  }
}
