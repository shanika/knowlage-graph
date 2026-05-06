import type {
  FileNode,
  GraphData,
  HealthResponse,
  MarkdownDoc,
} from "@llm-wiki-viz/shared";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => getJSON<HealthResponse>("/api/health"),
  tree: () => getJSON<FileNode>("/api/tree"),
  file: (path: string) =>
    getJSON<MarkdownDoc>(`/api/file?path=${encodeURIComponent(path)}`),
  graph: () => getJSON<GraphData>("/api/graph"),
};
