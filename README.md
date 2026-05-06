# Knowledge Graph

A simple, local Obsidian-style markdown viewer. Point it at a folder of `.md` files and get:

- A hierarchical file tree
- Full markdown rendering (GFM + raw HTML)
- Wiki-style `[[links]]` and standard `[text](relative.md)` links, both clickable
- Automatic **backlinks** for the file you're viewing
- An interactive **force-directed graph** showing how every note links to every other note
- Live updates as you edit files on disk

Read-only viewer (no in-browser editing yet).

## Stack

- **Monorepo**: npm workspaces
- **API**: Express 5 + TypeScript, `chokidar` for file watching, `unified` + `remark-wiki-link` for link extraction
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

## Useful endpoints

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Liveness + the absolute vault path the API is using |
| `GET /api/tree` | Recursive file tree (markdown files only) |
| `GET /api/file?path=notes/alpha.md` | File content, frontmatter, outgoing links, backlinks |
| `GET /api/graph` | All nodes and edges for the graph view |
