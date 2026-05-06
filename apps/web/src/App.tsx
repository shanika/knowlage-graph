import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import type { FileNode, GraphData, MarkdownDoc } from "@knowledge-graph/shared";
import { api } from "./api/client";
import { FileTree } from "./components/FileTree";
import { MarkdownView } from "./components/MarkdownView";
import { GraphView } from "./components/GraphView";

export default function App() {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const activePath = location.pathname.startsWith("/file/")
    ? decodeURIComponent(location.pathname.slice("/file/".length))
    : null;

  useEffect(() => {
    api.tree().then(setTree).catch((e) => setError(String(e)));
    api.graph().then(setGraph).catch((e) => setError(String(e)));
  }, []);

  // refresh graph when navigating between files (cheap; data is cached server-side)
  useEffect(() => {
    api.graph().then(setGraph).catch(() => {});
  }, [activePath]);

  return (
    <div className="h-full flex bg-[var(--color-bg)]">
      <Rail tree={tree} graph={graph} error={error} />
      <GraphPanel data={graph} activePath={activePath} />
      <DocPanel />
    </div>
  );
}

function Rail({
  tree,
  graph,
  error,
}: {
  tree: FileNode | null;
  graph: GraphData | null;
  error: string | null;
}) {
  const nodeCount = graph?.nodes.length ?? 0;
  const edgeCount = graph?.edges.length ?? 0;

  return (
    <aside className="w-[248px] shrink-0 border-r border-[var(--color-border)] flex flex-col">
      <header className="px-5 pt-6 pb-5 border-b border-[var(--color-border)]">
        <Link to="/" className="block group">
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)]">
            Knowledge Graph
          </div>
          <div className="mt-1.5 text-[var(--color-fg)] text-[17px] font-medium leading-tight flex items-center gap-2">
            <span className="text-[var(--color-accent)] text-[15px]">↗</span>
            <span className="truncate">Vault Atlas</span>
          </div>
        </Link>
      </header>

      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)]">
          Index
        </span>
        <span className="font-mono text-[11px] text-[var(--color-mute)] tabular-nums">
          · {nodeCount.toString().padStart(2, "0")}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto pb-4 pr-1">
        {error && (
          <div className="px-5 font-mono text-[12px] text-[var(--color-danger)]">
            {error}
          </div>
        )}
        {tree && <FileTree tree={tree} />}
      </nav>

      <footer className="border-t border-[var(--color-border)] px-5 py-4 space-y-1.5 font-mono text-[12px]">
        <Stat label="Nodes" value={nodeCount} />
        <Stat label="Threads" value={edgeCount} />
        <div className="flex items-center gap-2 pt-2.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-slow" />
          <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-mute)]">
            Live
          </span>
        </div>
      </footer>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[11px] tracking-[0.15em] uppercase text-[var(--color-mute)]">
        {label}
      </span>
      <span className="text-[var(--color-fg)] tabular-nums">
        {value.toString().padStart(3, "0")}
      </span>
    </div>
  );
}

function GraphPanel({
  data,
  activePath,
}: {
  data: GraphData | null;
  activePath: string | null;
}) {
  const nodeCount = data?.nodes.length ?? 0;
  const edgeCount = data?.edges.length ?? 0;
  const focusedNode = activePath
    ? data?.nodes.find((n) => n.id === activePath)
    : null;

  return (
    <section className="flex-1 min-w-0 graph-bg relative canvas-base">
      {/* top overlay */}
      <div className="absolute top-0 inset-x-0 z-10 px-7 pt-5 flex items-start justify-between pointer-events-none">
        <div>
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)]">
            Graph
          </div>
          <div className="mt-1.5 text-[var(--color-fg)] text-[18px] font-medium leading-tight">
            The constellation of notes
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-[var(--color-mute)]">
            Force · Directed
          </div>
          <div className="mt-1.5 font-mono text-[12px] text-[var(--color-fg-2)] tabular-nums">
            {nodeCount.toString().padStart(2, "0")}
            <span className="text-[var(--color-mute)] mx-1.5">·</span>
            {edgeCount.toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* bottom overlay */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-7 pb-5 flex items-end justify-between pointer-events-none">
        {focusedNode ? (
          <div className="reveal min-w-0 max-w-[60%] pointer-events-auto">
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)] mb-1.5">
              Focus
            </div>
            <div className="text-[var(--color-amber)] text-[20px] font-medium leading-tight truncate">
              {focusedNode.label}
            </div>
            <div className="mt-1 font-mono text-[11px] text-[var(--color-mute)] truncate">
              {focusedNode.id}
            </div>
          </div>
        ) : (
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)]">
            ◌ No focus
          </div>
        )}
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)] text-right">
          Drag · Zoom · Click
        </div>
      </div>

      {/* corner crosshairs */}
      <Crosshair pos="tl" />
      <Crosshair pos="tr" />
      <Crosshair pos="bl" />
      <Crosshair pos="br" />

      {data ? (
        <GraphView data={data} activePath={activePath} />
      ) : (
        <div className="absolute inset-0 grid place-items-center font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--color-mute)]">
          ◌ Awaiting data
        </div>
      )}
    </section>
  );
}

function Crosshair({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const v: Record<string, string> = {
    tl: "top-3 left-3 border-l border-t",
    tr: "top-3 right-3 border-r border-t",
    bl: "bottom-3 left-3 border-l border-b",
    br: "bottom-3 right-3 border-r border-b",
  };
  return (
    <div
      className={`absolute ${v[pos]} z-10 w-3 h-3 pointer-events-none border-[var(--color-border-2)]`}
      aria-hidden
    />
  );
}

function DocPanel() {
  return (
    <section className="basis-[50%] shrink-0 border-l border-[var(--color-border)] overflow-y-auto bg-[var(--color-bg)]">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/file/*" element={<FileRoute />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
    </section>
  );
}

function Welcome() {
  return (
    <div className="px-12 py-14 max-w-2xl">
      <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)] mb-5 reveal flex items-center gap-3">
        <span>Welcome</span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-[var(--color-fg-2)]">v · 0 · 1</span>
      </div>
      <h1 className="text-[var(--color-fg)] text-[40px] font-semibold leading-[1.1] tracking-[-0.022em] reveal reveal-1">
        A map of your notes.
      </h1>
      <p className="text-[var(--color-fg-2)] text-[17px] leading-[1.7] mt-5 max-w-[58ch] reveal reveal-2">
        Pick a node from the constellation on your left, or a file from the
        index. Each note becomes a star; every link, a thread between them.
      </p>

      <div className="mt-12 pt-7 border-t border-[var(--color-border)] reveal reveal-3">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)] mb-5">
          How it works
        </div>
        <ol className="space-y-4 text-[16px] leading-[1.7] text-[var(--color-fg-2)]">
          <Method
            n="01"
            children={
              <>
                Wiki-style{" "}
                <Code>[[links]]</Code> bind one note to another. Aliases via{" "}
                <Code>|</Code> are honoured.
              </>
            }
          />
          <Method
            n="02"
            children={
              <>
                Plain markdown <Code>[refs](paths.md)</Code> are tracked just
                the same.
              </>
            }
          />
          <Method
            n="03"
            children={<>Edits on disk reindex live; no restart required.</>}
          />
        </ol>
      </div>

      <div className="mt-10 pt-6 border-t border-[var(--color-border)] reveal reveal-4">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)] mb-3">
          Tip
        </div>
        <p className="text-[var(--color-fg-2)] text-[15px] leading-[1.7]">
          The graph view auto-centers and zooms onto whichever note you open,
          and lights up its direct neighbours. Click any star to navigate.
        </p>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.88em] bg-[rgba(125,211,252,0.1)] text-[var(--color-accent)] px-1.5 py-0.5 rounded border border-[rgba(125,211,252,0.16)]">
      {children}
    </code>
  );
}

function Method({
  n,
  children,
}: {
  n: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2.6rem_1fr] gap-3 items-baseline">
      <span className="font-mono text-[var(--color-accent)] text-[12px] tabular-nums tracking-wider">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function FileRoute() {
  const location = useLocation();
  const path = decodeURIComponent(location.pathname.slice("/file/".length));
  const [doc, setDoc] = useState<MarkdownDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDoc(null);
    setError(null);
    if (!path) return;
    api.file(path).then(setDoc).catch((e) => setError(String(e)));
  }, [path]);

  if (error)
    return (
      <div className="px-12 py-14 font-mono text-[14px] text-[var(--color-danger)] tracking-wider">
        ✕ {error}
      </div>
    );
  if (!doc)
    return (
      <div className="px-12 py-14 font-mono text-[11px] text-[var(--color-mute)] tracking-[0.2em] uppercase">
        ◌ Loading…
      </div>
    );
  return <MarkdownView doc={doc} />;
}
