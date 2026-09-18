# Cloudflare Workers Builds — EasyLab Projects

The previous failure (`Could not find compiled Open Next config`) happens when Workers Builds runs plain `next build` then `npx wrangler deploy`.

OpenNext needs its own build so `.open-next/` exists before deploy.

## Required Build settings (Dashboard)

Workers & Pages → `easylab-projects` → Settings → Build:

| Setting | Value |
|---------|--------|
| **Build command** | `npx opennextjs-cloudflare build` |
| **Deploy command** | `npx opennextjs-cloudflare deploy` |

Do **not** use `npx wrangler deploy` as the deploy command for this app.

Equivalent npm scripts:

| Setting | Value |
|---------|--------|
| Build command | `npm run build:worker` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

Notes:
- Keep `package.json` → `"build": "… next build …"` unchanged. `opennextjs-cloudflare build` calls that script internally, then produces `.open-next`.
- Node.js **22+** recommended on the build image (Wrangler 4).
- After a successful deploy, attach custom domain `projects.easylab.online` under Domains & Routes (see `docs/DOMAIN.md`).
