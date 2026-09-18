# Domain: projects.easylab.online

## Cloudflare Workers custom domain

Worker name in `wrangler.jsonc`: **easylab-projects**

### Recommended setup
1. `npm run deploy`
2. Dashboard → Workers & Pages → easylab-projects → Domains & Routes → Add `projects.easylab.online`
3. Confirm DNS in the `easylab.online` zone:
   - `projects` → proxied record pointing at the Worker

### Optional wrangler routes
Uncomment in `wrangler.jsonc`:

```jsonc
"routes": [
  { "pattern": "projects.easylab.online/*", "zone_name": "easylab.online" }
]
```

Zone `easylab.online` must live on the same Cloudflare account as the Worker.
