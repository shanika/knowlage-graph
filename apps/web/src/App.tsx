import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import type { FileNode, GraphData, MarkdownDoc } from "@llm-wiki-viz/shared";
import { api } from "./api/client";
import { FileTree } from "./components/FileTree";
import { MarkdownView } from "./components/MarkdownView";
import { Backlinks } from "./components/Backlinks";
import { GraphView } from "./components/GraphView";

export default function App() {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.tree().then(setTree).catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="h-full flex">
      <aside className="w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-panel)] flex flex-col">
        <header className="px-3 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold tracking-wide">
            Knowledge Graph
          </Link>
          <NavLink
            to="/graph"
            className={({ isActive }) =>
              "text-xs px-2 py-1 rounded border border-[var(--color-border)] " +
              (isActive
                ? "bg-[var(--color-accent-soft)] text-white"
                : "text-[var(--color-muted)] hover:text-[var(--color-fg)]")
            }
          >
            Graph
          </NavLink>
        </header>
        <div className="flex-1 overflow-y-auto py-2">
          {error && <div className="px-3 text-red-400 text-xs">{error}</div>}
          {tree && <FileTree tree={tree} />}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/graph" element={<GraphRoute />} />
          <Route path="/file/*" element={<FileRoute />} />
        </Routes>
      </main>
    </div>
  );
}

function Welcome() {
  return (
    <div className="p-10 text-[var(--color-muted)]">
      <h1 className="text-2xl text-[var(--color-fg)] font-semibold mb-2">
        Welcome
      </h1>
      <p>Pick a file from the sidebar, or open the graph view.</p>
    </div>
  );
}

function FileRoute() {
  const params = useParams();
  const path = params["*"] ?? "";
  const [doc, setDoc] = useState<MarkdownDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDoc(null);
    setError(null);
    if (!path) return;
    api.file(path).then(setDoc).catch((e) => setError(String(e)));
  }, [path]);

  if (error) return <div className="p-10 text-red-400 text-sm">{error}</div>;
  if (!doc) return <div className="p-10 text-[var(--color-muted)]">Loading…</div>;

  return (
    <div className="h-full flex">
      <section className="flex-1 min-w-0 overflow-y-auto">
        <MarkdownView doc={doc} />
      </section>
      <aside className="w-72 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto p-3">
        <h2 className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-3">
          Backlinks ({doc.backlinks.length})
        </h2>
        <Backlinks items={doc.backlinks} />
      </aside>
    </div>
  );
}

function GraphRoute() {
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.graph().then(setData).catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="p-10 text-red-400 text-sm">{error}</div>;
  if (!data) return <div className="p-10 text-[var(--color-muted)]">Loading…</div>;
  return <GraphView data={data} />;
}
