import path from "node:path";
import matter from "gray-matter";

export interface RawLink {
  raw: string;
  label: string;
  // For wiki-links this is the page name; for md-links it's the relative path.
  target: string;
  kind: "wiki" | "md";
  // Byte offset in the original markdown content (used for snippet extraction).
  index: number;
}

const WIKI_LINK_RE = /\[\[([^\]\n|]+?)(?:\|([^\]\n]+))?\]\]/g;
// Matches [text](path) where path doesn't start with a scheme like http:, mailto:, #
const MD_LINK_RE = /\[([^\]]+)\]\(([^)\s]+?)\)/g;

export interface ParsedDoc {
  frontmatter: Record<string, unknown>;
  content: string;
  links: RawLink[];
}

export function parseMarkdown(raw: string): ParsedDoc {
  const parsed = matter(raw);
  const content = parsed.content;
  const links: RawLink[] = [];

  for (const m of content.matchAll(WIKI_LINK_RE)) {
    const target = m[1]!.trim();
    const label = (m[2] ?? m[1]!).trim();
    links.push({
      raw: m[0],
      label,
      target,
      kind: "wiki",
      index: m.index ?? 0,
    });
  }

  for (const m of content.matchAll(MD_LINK_RE)) {
    const text = m[1]!;
    const href = m[2]!;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) continue;
    links.push({
      raw: m[0],
      label: text,
      target: href,
      kind: "md",
      index: m.index ?? 0,
    });
  }

  return {
    frontmatter: parsed.data as Record<string, unknown>,
    content,
    links,
  };
}

// Build a vault-relative path target for a link given the source file's vault path.
// Returns null when the resolution can't be guessed (caller does final existence check).
export function resolveLinkTarget(
  link: RawLink,
  sourceVaultPath: string,
  basenameIndex: Map<string, string[]>
): string | null {
  if (link.kind === "md") {
    const sourceDir = path.posix.dirname(sourceVaultPath);
    const joined = path.posix.normalize(path.posix.join(sourceDir, link.target));
    return joined.replace(/^\.\//, "");
  }

  // Wiki-link: try direct path match first (handles [[notes/alpha]]),
  // then basename match.
  const direct = link.target.endsWith(".md") ? link.target : `${link.target}.md`;
  const lower = direct.toLowerCase();
  const byBasename = basenameIndex.get(path.posix.basename(lower));
  if (byBasename && byBasename.length > 0) {
    return byBasename[0]!;
  }
  return direct;
}

export function makeSnippet(content: string, index: number, span = 60): string {
  const start = Math.max(0, index - span);
  const end = Math.min(content.length, index + span);
  const slice = content.slice(start, end).replace(/\s+/g, " ").trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}
