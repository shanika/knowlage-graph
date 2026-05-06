# llm-wiki-viz

A small, local Obsidian-style markdown viewer. Point it at a folder of `.md` files and you get:

- A hierarchical file tree
- Full markdown rendering (GFM + raw HTML)
- Wiki-style `[[links]]` and standard `[text](relative.md)` links, both clickable
- Automatic **backlinks** for whatever file you're viewing
- An interactive **force-directed graph** showing how every note links to every other
- Live updates as you edit files on disk

Read-only viewer (no in-browser editing).

## Stack

- **Monorepo**: npm workspaces
- **API**: Express 4 + TypeScript, `chokidar` for file watching, `gray-matter` for frontmatter
- **Web**: Vite + React 18 + TypeScript, `react-markdown`, `react-force-graph-2d`, `react-router-dom`
- **Styling**: Tailwind CSS v4 via the `@tailwindcss/vite` plugin

## Layout

```
.
├── apps/
│   ├── api/       # Express API (port 4000)
│   └── web/       # React + Vite UI (port 5173)
├── packages/
│   └── shared/    # Types shared between API and web
└── vault/         # Default sample markdown vault
```

## Setup

```bash
# Requires Node 18+ and npm 9+

# 1. Install everything (one install, all workspaces)
npm install

# 2. (Optional) point at your own vault
cp .env.example .env
#   then edit .env and set VAULT_PATH

# 3. Run api + web together
npm run dev
```

- API: <http://localhost:4000>
- Web: <http://localhost:5173>

The web dev server proxies `/api/*` to the API, so you only need to open the web URL.

## Configuring the vault

The folder being browsed is controlled by the `VAULT_PATH` env var, read by `apps/api`. It can be absolute or relative; relative paths resolve from `apps/api`'s working directory.

If unset, the API falls back to `../../vault` (the seed vault at the repo root).

## API endpoints

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Liveness + the absolute vault path the API is using |
| `GET /api/tree` | Recursive file tree (markdown files only) |
| `GET /api/file?path=notes/alpha.md` | File content, frontmatter, outgoing links, backlinks |
| `GET /api/graph` | All nodes and edges for the graph view |

## Contributing

Issues and PRs welcome. The code is small and intentionally so — the goal is a viewer that is easy to read end-to-end. Please:

1. Run `npm run typecheck` and `npm run build` before opening a PR.
2. Keep dependencies minimal.
3. Don't introduce frameworks for problems the standard library can already solve.

## License

[MIT](./LICENSE) © Shanika Wijerathna
