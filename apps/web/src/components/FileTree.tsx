import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { FileNode } from "@knowledge-graph/shared";

interface Props {
  tree: FileNode;
}

export function FileTree({ tree }: Props) {
  return (
    <ul>
      {tree.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={0} />
      ))}
    </ul>
  );
}

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.startsWith("/file/")
    ? decodeURIComponent(location.pathname.slice("/file/".length))
    : "";

  const indent = { paddingLeft: `${depth * 14 + 20}px` };

  if (node.type === "directory") {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={indent}
          className="w-full flex items-center gap-2 py-1.5 mt-1 text-left text-[var(--color-mute)] hover:text-[var(--color-fg-2)] transition-colors font-mono text-[11px] tracking-[0.15em] uppercase"
        >
          <span className="opacity-70 w-2.5 inline-block">
            {open ? "−" : "+"}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children && node.children.length > 0 && (
          <ul>
            {node.children.map((child) => (
              <TreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const active = currentPath === node.path;
  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/file/${node.path}`)}
        style={indent}
        className={
          "w-full flex items-center gap-2 py-1.5 pr-3 text-left transition-colors group relative " +
          (active
            ? "text-[var(--color-amber)]"
            : "text-[var(--color-fg-2)] hover:text-[var(--color-fg)]")
        }
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[var(--color-amber)] rounded-full"
          />
        )}
        <span
          className={
            "w-2.5 inline-block text-[12px] " +
            (active
              ? "text-[var(--color-amber)]"
              : "text-[var(--color-dim)] group-hover:text-[var(--color-mute)]")
          }
        >
          {active ? "›" : "·"}
        </span>
        <span className="truncate text-[13.5px]">
          {node.name.replace(/\.md$/, "")}
        </span>
      </button>
    </li>
  );
}
