# create-gas-kit

Scaffold a Google Apps Script web app with Vite, TypeScript and a one-command deploy.

```sh
npm create gas-kit@latest my-app
# or: pnpm create gas-kit my-app / bun create gas-kit my-app
```

The CLI asks a few questions, copies the project, installs dependencies, and runs the
project's `setup` script, which logs in to clasp and creates (or connects) the Apps
Script project. Every question has a flag, so the whole run can be non-interactive.

| question                          | flag                                           | default    |
| --------------------------------- | ---------------------------------------------- | ---------- |
| project name                      | positional `<dir>`                             | `gas-app`  |
| client                            | `--client react\|vanilla\|vue\|svelte\|preact` | `react`    |
| styling                           | `--ui tailwind\|none`                          | `tailwind` |
| shadcn/ui (react + tailwind only) | `--shadcn` / `--no-shadcn`                     | on         |
| gas-sheets-query example          | `--gsquery` / `--no-gsquery`                   | off        |
| local GWS emulator                | `--gws-emul` / `--no-gws-emul`                 | off        |
| run setup after install           | `--setup` / `--no-setup`                       | on         |
| git init, install                 | `--no-git`, `--no-install`                     | on         |

Requires Node 20+. The package manager is detected from how you invoked the command
(`npm`, `pnpm` or `bun`) and used for install and for the printed next steps.

## What you get

A single-package project: `src/client` (Vite app), `src/server` (Apps Script code,
bundled to `Code.gs`), `src/shared/api.ts` (the RPC contract both sides import).
`scripts/build.mjs` turns it into `build/` — `Code.gs`, `index.html`, `app.html`,
`appsscript.json` — and [gas-app-kit](https://github.com/juhyeonni/gas-app-kit) pushes
and deploys it per environment.

```sh
pnpm run dev        # Vite dev server; server calls hit src/client/mock.ts (or the GWS emulator)
pnpm run push dev   # test → build → clasp push to the "dev" environment
pnpm run deploy dev # push, then create/update the web app deployment
pnpm run open dev   # open the editor / web app
pnpm run setup      # add another environment
```

Environments live in `envs.json`; `.clasp.json` is generated and ignored. The web app
manifest defaults to `access: MYSELF` and `setup` asks whether to widen it to
`DOMAIN` (Workspace) or `ANYONE` — `ANYONE` is refused under many Workspace policies
and `DOMAIN` is invalid for personal accounts, so neither is a safe default.

Design notes are in [docs/PLAN.md](docs/PLAN.md).

## License

MIT
