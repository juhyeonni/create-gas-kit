# __APP_NAME__

A Google Apps Script web app scaffolded with [create-gas-kit](https://github.com/juhyeonni/create-gas-kit).

```
src/client/   Vite app; call('action', ...args) in api.ts reaches the server
src/server/   Apps Script code; index.ts exposes doGet and rpc(action, args)
src/shared/   api.ts — the Api interface both sides implement
scripts/      build.mjs (bundle to build/), setup.mjs (create/connect the GAS project)
envs.json     environments, managed by gas-app-kit
```

## Commands

```sh
pnpm run dev          # Vite dev server with mocked server calls
pnpm run test         # vitest
pnpm run typecheck    # tsc -b (client + server)
pnpm run build        # build/Code.gs, index.html, app.html, appsscript.json
pnpm run push dev     # test → build → clasp push to "dev"
pnpm run deploy dev   # push, then create/update the web app deployment
pnpm run open dev     # open the editor / web app
pnpm run setup        # add or connect an environment
```

Replace `pnpm run` with `npm run` or `bun run` if that is what you use.

## Deploying

`setup` logs in to clasp, creates or connects an Apps Script project, records it in
`envs.json`, and asks who may open the web app (`MYSELF`, `DOMAIN`, `ANYONE`). That
choice is written to `appsscript.json`; edit it there to change it later. Add more
environments with `pnpm run setup` and deploy them with `pnpm run deploy <env>`.

Server code that reads a spreadsheet uses the bound spreadsheet or the `SPREADSHEET_ID`
script property — see `src/server/spreadsheet.ts`.
