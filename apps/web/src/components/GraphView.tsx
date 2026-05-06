import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import type { GraphData } from "@knowledge-graph/shared";

interface Props {
  data: GraphData;
  activePath: string | null;
}

interface FGNode {
  id: string;
  label: string;
  broken?: boolean;
  x?: number;
  y?: number;
}

interface FGLink {
  source: string | FGNode;
  target: string | FGNode;
}

function readVars() {
  const s = getComputedStyle(document.documentElement);
  return {
    accent: s.getPropertyValue("--color-accent").trim() || "#7DD3FC",
    accentStrong:
      s.getPropertyValue("--color-accent-strong").trim() || "#BAE6FD",
    amber: s.getPropertyValue("--color-amber").trim() || "#FBBF24",
    amberStrong:
      s.getPropertyValue("--color-amber-strong").trim() || "#FCD34D",
    fg: s.getPropertyValue("--color-fg").trim() || "#E6EDF3",
    fg2: s.getPropertyValue("--color-fg-2").trim() || "#B8C2D6",
    mute: s.getPropertyValue("--color-mute").trim() || "#6B7896",
  };
}

function endpointId(end: string | FGNode): string {
  return typeof end === "object" ? end.id : end;
}

export function GraphView({ data, activePath }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 600, height: 600 });
  const navigate = useNavigate();
  const vars = useRef(readVars());

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Center on the active node only on first mount (direct URL load) — never on
  // subsequent clicks, because the auto-pan was making nodes hard to click.
  const didInitialCenter = useRef(false);
  useEffect(() => {
    if (didInitialCenter.current) return;
    if (!fgRef.current || !activePath) return;
    const t = setTimeout(() => {
      const node = data.nodes.find((n) => n.id === activePath) as
        | FGNode
        | undefined;
      if (node && typeof node.x === "number" && typeof node.y === "number") {
        fgRef.current.centerAt(node.x, node.y, 600);
        fgRef.current.zoom(2.2, 600);
        didInitialCenter.current = true;
      }
    }, 250);
    return () => clearTimeout(t);
  }, [activePath, data]);

  // Memoize so we don't pass a fresh graphData reference on every render —
  // ForceGraph2D would interpret that as new data and re-heat the simulation,
  // which is exactly the "animation on hover" we're trying to kill.
  const graph = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        broken: n.broken,
      })),
      links: data.edges.map((e) => ({ source: e.source, target: e.target })),
    }),
    [data]
  );

  const neighbours = useMemo(() => {
    const set = new Set<string>();
    if (activePath) {
      for (const e of data.edges) {
        if (e.source === activePath) set.add(e.target);
        if (e.target === activePath) set.add(e.source);
      }
    }
    return set;
  }, [data.edges, activePath]);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 w-full h-full"
      style={{ cursor: "grab" }}
    >
      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={graph}
        backgroundColor="rgba(0,0,0,0)"
        cooldownTicks={180}
        d3AlphaDecay={0.025}
        d3VelocityDecay={0.32}
        warmupTicks={20}
        linkColor={(rawLink) => {
          const link = rawLink as FGLink;
          const src = endpointId(link.source);
          const tgt = endpointId(link.target);
          if (activePath && (src === activePath || tgt === activePath))
            return "rgba(251, 191, 36, 0.55)";
          return "rgba(125, 211, 252, 0.16)";
        }}
        linkWidth={(rawLink) => {
          const link = rawLink as FGLink;
          const src = endpointId(link.source);
          const tgt = endpointId(link.target);
          return activePath && (src === activePath || tgt === activePath)
            ? 1.6
            : 0.7;
        }}
        linkDirectionalParticles={(rawLink) => {
          const link = rawLink as FGLink;
          const src = endpointId(link.source);
          const tgt = endpointId(link.target);
          if (activePath && (src === activePath || tgt === activePath))
            return 2;
          return 0;
        }}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => vars.current.amber}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as FGNode;
          if (n.x == null || n.y == null) return;
          const isActive = n.id === activePath;
          const isNeighbour = neighbours.has(n.id);
          // Node radius is fixed regardless of hover so the click target stays put.
          const baseR = isActive ? 5.5 : n.broken ? 2 : 3.2;

          // Aura only on the active node — never on hover.
          if (isActive) {
            const aura = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 30);
            aura.addColorStop(0, "rgba(251, 191, 36, 0.55)");
            aura.addColorStop(0.5, "rgba(251, 191, 36, 0.18)");
            aura.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 30, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
            ctx.lineWidth = 1 / globalScale;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 11, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Node body
          let fill: string;
          if (n.broken) fill = "#3F4866";
          else if (isActive) fill = vars.current.amberStrong;
          else if (isNeighbour) fill = vars.current.accentStrong;
          else fill = vars.current.accent;
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(n.x, n.y, baseR, 0, Math.PI * 2);
          ctx.fill();

          // Specular highlight
          if (!n.broken) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
            ctx.beginPath();
            ctx.arc(
              n.x - baseR * 0.32,
              n.y - baseR * 0.32,
              baseR * 0.3,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Label — fixed size; no hover scaling.
          const labelEm = isActive ? 14 : isNeighbour ? 13 : 12;
          const fontSize = labelEm / globalScale;
          ctx.font = `${
            isActive ? 600 : 500
          } ${fontSize}px Geist, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          let labelColor: string;
          if (isActive) labelColor = vars.current.amberStrong;
          else if (n.broken) labelColor = "rgba(120, 130, 160, 0.55)";
          else if (isNeighbour) labelColor = vars.current.fg;
          else labelColor = vars.current.fg2;
          ctx.fillStyle = labelColor;
          ctx.fillText(n.label, n.x, n.y + baseR + 6);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as FGNode;
          if (n.x == null || n.y == null) return;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
          ctx.fill();
        }}
        onNodeHover={(node) => {
          // Imperative cursor change only — no React state, no re-render,
          // no graphData re-evaluation. The simulation stays put.
          if (wrapRef.current) {
            wrapRef.current.style.cursor = node ? "pointer" : "grab";
          }
        }}
        onNodeClick={(node) => {
          const n = node as FGNode;
          if (!n.broken) navigate(`/file/${n.id}`);
        }}
        onEngineStop={() => {
          // Pin every node where the simulation left it. Clicks then hit a
          // stationary target instead of one that's still drifting.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fg = fgRef.current as any;
          if (!fg) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const n of graph.nodes as any[]) {
            if (typeof n.x === "number" && typeof n.y === "number") {
              n.fx = n.x;
              n.fy = n.y;
            }
          }
        }}
      />
    </div>
  );
}
