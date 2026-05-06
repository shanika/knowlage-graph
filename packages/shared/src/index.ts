// Vault-relative, forward-slash-separated paths used everywhere in the API.
export type VaultPath = string;

export interface FileNode {
  name: string;
  path: VaultPath;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface LinkRef {
  // Resolved target path inside the vault, or null if the link couldn't be resolved.
  target: VaultPath | null;
  // What the user typed in the source file ([[Page]] or relative.md).
  raw: string;
  // Display text — alias for wiki-links, link text for md-links.
  label: string;
}

export interface Backlink {
  source: VaultPath;
  // Short context snippet around the link occurrence.
  snippet: string;
}

export interface MarkdownDoc {
  path: VaultPath;
  title: string;
  content: string;
  frontmatter: Record<string, unknown>;
  outgoing: LinkRef[];
  backlinks: Backlink[];
}

export interface GraphNode {
  id: VaultPath;
  label: string;
  // True when no file exists at this path (a dangling [[link]]).
  broken?: boolean;
}

export interface GraphEdge {
  source: VaultPath;
  target: VaultPath;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface HealthResponse {
  ok: true;
  vault: string;
}
