import { Link } from "react-router-dom";
import type { Backlink } from "@llm-wiki-viz/shared";

interface Props {
  items: Backlink[];
}

export function Backlinks({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-[var(--color-muted)] text-sm">No backlinks yet.</div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((b) => (
        <li
          key={b.source}
          className="rounded border border-[var(--color-border)] p-2 bg-[var(--color-panel-2)]"
        >
          <Link
            to={`/file/${b.source}`}
            className="text-[var(--color-accent)] text-sm font-medium hover:underline"
          >
            {b.source.replace(/\.md$/, "")}
          </Link>
          <p className="text-xs text-[var(--color-muted)] mt-1">{b.snippet}</p>
        </li>
      ))}
    </ul>
  );
}
