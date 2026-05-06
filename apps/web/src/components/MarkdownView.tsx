import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Link } from "react-router-dom";
import type { MarkdownDoc } from "@knowledge-graph/shared";
import { References } from "./Backlinks";

interface Props {
  doc: MarkdownDoc;
}

const WIKI_LINK_RE = /\[\[([^\]\n|]+?)(?:\|([^\]\n]+))?\]\]/g;

// Rewrite every link the API resolved (both `[[wiki]]` and `[md](path.md)`) to a
// custom `kg://file/<vault-path>` URL. The <a> override below catches that scheme
// and renders a react-router <Link> so navigation stays in-app.
function preprocessLinks(doc: MarkdownDoc): string {
  // Pass 1: wiki-style links — handle resolved + broken in one regex sweep.
  const wikiByRaw = new Map<string, { target: string | null; label: string }>();
  for (const link of doc.outgoing) {
    if (link.raw.startsWith("[[")) {
      wikiByRaw.set(link.raw, { target: link.target, label: link.label });
    }
  }
  let content = doc.content.replace(WIKI_LINK_RE, (match) => {
    const ref = wikiByRaw.get(match);
    if (!ref) return match;
    if (ref.target) {
      return `[${ref.label}](kg://file/${encodeURI(ref.target)})`;
    }
    return `<span class="kg-broken">${ref.label}</span>`;
  });

  // Pass 2: standard markdown links the API was able to resolve to a vault file.
  // String split/join gives a literal-text replaceAll without regex escaping.
  for (const link of doc.outgoing) {
    if (link.raw.startsWith("[[")) continue;
    if (!link.target) continue;
    const replacement = `[${link.label}](kg://file/${encodeURI(link.target)})`;
    content = content.split(link.raw).join(replacement);
  }

  return content;
}

// Pretty-print the path: "notes/alpha.md" → "notes / alpha.md"
function formatBreadcrumb(path: string): string {
  return path.split("/").join(" / ");
}

export function MarkdownView({ doc }: Props) {
  const processed = useMemo(() => preprocessLinks(doc), [doc]);
  const resolvedOut = doc.outgoing.filter((l) => l.target !== null).length;

  return (
    <article className="px-12 py-12 max-w-2xl reveal">
      <header className="mb-9">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--color-mute)] mb-4 flex items-center gap-3">
          <span>File</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-[var(--color-fg-2)] tracking-[0.05em] normal-case">
            {formatBreadcrumb(doc.path)}
          </span>
        </div>
        <h1 className="text-[var(--color-fg)] text-[36px] font-semibold leading-[1.12] tracking-[-0.022em]">
          {doc.title}
        </h1>
        <div className="mt-5 flex items-center gap-5 font-mono text-[12px] text-[var(--color-mute)]">
          <span className="tabular-nums inline-flex items-center gap-1.5">
            <span className="text-[var(--color-accent)]">↗</span>
            <span className="text-[var(--color-fg-2)]">
              {resolvedOut.toString().padStart(2, "0")}
            </span>
            <span className="tracking-[0.15em] uppercase text-[10px]">
              outgoing
            </span>
          </span>
          <span className="tabular-nums inline-flex items-center gap-1.5">
            <span className="text-[var(--color-accent)]">↩</span>
            <span className="text-[var(--color-fg-2)]">
              {doc.backlinks.length.toString().padStart(2, "0")}
            </span>
            <span className="tracking-[0.15em] uppercase text-[10px]">
              incoming
            </span>
          </span>
        </div>
      </header>

      <div className="prose-doc">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          // Default urlTransform sanitizes unknown schemes — including our
          // kg:// — to "". Pass URLs through as-is; content is local + trusted.
          urlTransform={(url) => url}
          components={{
            // The doc title is rendered in the editorial header above; suppress the body h1 to avoid duplicates.
            h1: () => null,
            a: ({ href, children, ...rest }) => {
              if (href?.startsWith("kg://file/")) {
                const target = decodeURI(href.slice("kg://".length));
                return <Link to={`/${target}`}>{children}</Link>;
              }
              return (
                <a href={href} target="_blank" rel="noreferrer" {...rest}>
                  {children}
                </a>
              );
            },
            span: ({ className, children, ...rest }) => {
              if (className === "kg-broken") {
                return (
                  <span className="kg-broken" title="unresolved link">
                    {children}
                  </span>
                );
              }
              return (
                <span className={className} {...rest}>
                  {children}
                </span>
              );
            },
          }}
        >
          {processed}
        </ReactMarkdown>
      </div>

      <References items={doc.backlinks} />
    </article>
  );
}
