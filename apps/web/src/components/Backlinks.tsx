import { Link } from "react-router-dom";
import type { Backlink } from "@knowledge-graph/shared";

interface Props {
  items: Backlink[];
}

export function References({ items }: Props) {
  return (
    <footer className="mt-16 pt-8 border-t border-[var(--color-border)] reveal reveal-2">
      <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)] mb-7 flex items-center gap-3">
        <span>Backlinks</span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-[var(--color-fg-2)] tabular-nums">
          {items.length.toString().padStart(2, "0")}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-[var(--color-mute)] text-[15px] leading-[1.65]">
          No incoming references yet.
        </p>
      ) : (
        <ol className="space-y-6">
          {items.map((b, i) => (
            <li
              key={b.source}
              className="grid grid-cols-[2.6rem_1fr] gap-3 items-start"
            >
              <span className="font-mono text-[var(--color-accent)] text-[12px] tabular-nums tracking-wider pt-[3px]">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <div>
                <Link
                  to={`/file/${b.source}`}
                  className="font-mono text-[12.5px] text-[var(--color-accent)] hover:text-[var(--color-accent-strong)] inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>↪</span>
                  <span>{b.source}</span>
                </Link>
                <p className="text-[var(--color-fg-2)] text-[15.5px] mt-1.5 leading-[1.65]">
                  {b.snippet}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </footer>
  );
}

// Backwards-compatible alias kept for any external imports of the old name.
export const Backlinks = References;
