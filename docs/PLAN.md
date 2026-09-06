# create-gas-kit — implementation plan

Scaffolding CLI for Google Apps Script web apps. `npm create gas-kit` (also `pnpm create gas-kit`, `bun create gas-kit`).
Decisions below were settled in a planning session on 2026-09-06 and are not up for re-litigation during implementation.

## Package (this repo)

- npm name `create-gas-kit`, bin `create-gas-kit` → `dist/index.js`. Repo: `github.com/juhyeonni/create-gas-kit`.
- TypeScript, bundled with one esbuild command into `dist/index.js` (ESM, node20). Only runtime dependency: `@clack/prompts`.
- `engines.node >= 20`. Tests with `node:test` (no vitest here). `files: ["dist", "templates"]`.
- Keep `src/` to a handful of files: arg parsing (`node:util` parseArgs), prompts, package-manager detection, scaffold (overlay copy + package.json merge + vite.config compose), post-steps (git init, install, setup).

## Prompts and flags

All prompts have a flag; when every needed value is given by flags the CLI is non-interactive.

| #   | prompt            | values / flag                                                                                                                                                                                                   |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | project name      | positional `<dir>`; kebab-case `^[a-z0-9][a-z0-9-]*$`                                                                                                                                                           |
| 2   | client            | `--client react\|vanilla\|vue\|svelte\|preact`                                                                                                                                                                  |
| 3   | ui                | `--ui tailwind\|none`                                                                                                                                                                                           |
| 4   | shadcn/ui         | `--shadcn` / `--no-shadcn`; asked only when react + tailwind                                                                                                                                                    |
| 5   | gas-sheets-query  | `--gsquery` / `--no-gsquery`                                                                                                                                                                                    |
| 6   | gws-emul          | `--gws-emul` / `--no-gws-emul`                                                                                                                                                                                  |
| 7   | git init, install | on by default; `--no-git`, `--no-install`                                                                                                                                                                       |
| 8   | GAS project       | `--setup` / `--no-setup`; runs the generated project's `scripts/setup.mjs` after install; not asked when `--no-install`. When skipped, next steps print `<pm> run setup` and the hand-written `envs.json` shape |

TypeScript is always on. Package manager is detected from `npm_config_user_agent` (npm / pnpm / bun; default npm) and used for install and for printed commands. Timezone for `appsscript.json` is `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## Generated project (single package)

```
<name>/
  package.json            name set by CLI; scripts: dev, build, typecheck, lint, format, test, setup, push, deploy, open
  appsscript.json         V8, timeZone, webapp { access: MYSELF, executeAs: USER_ACCESSING }; access is chosen in setup
  index.html              vite dev entry, <script type=module src=/src/client/main.ts(x)>
  vite.config.ts          COMPOSED by CLI (plugin list); alias + dev server only — build options live in gas-app-kit
  tsconfig.json           references only
  tsconfig.client.json    DOM lib, jsx when react, paths @/* -> src/client/*, includes src/client + src/shared
  tsconfig.server.json    no DOM, types google-apps-script, includes src/server + src/shared
  eslint.config.js, .prettierrc, vitest.config.ts, README.md, _gitignore (renamed to .gitignore on copy)
  scripts/build.mjs       three lines: `buildWebApp()` from gas-app-kit, see pipeline
  scripts/setup.mjs       see setup
  src/shared/api.ts       `Api` interface: action name -> (args) => result; shared by server and client
  src/server/index.ts     doGet, include, rpc(action, args) dispatcher
  src/server/counter.ts   server counter stored in PropertiesService script properties
  src/client/api.ts       call(action, ...args): google.script.run if present, else ./mock
  src/client/mock.ts      per-action mock map (removed by gws-emul overlay)
  src/client/index.css    the ONLY file the ui choice changes (plain CSS vs @import "tailwindcss" + @apply)
  src/client/...          framework files
```

- Deploy is entirely gas-app-kit (`gas-app push|deploy|open <env>`). `envs.json` is written by setup; `.clasp.json` is managed by gas-app-kit and gitignored, as is `build/`, `dist/`, `.gws-emul/`.
- Example app: client counter (in-memory) + server counter (PropertiesService). Markup uses semantic class names (`.counter`, `.button`, …) so client code is identical for `tailwind` and `none`.
- React client ships `src/client/components/ui/button.tsx` (a plain `<button className="button">`). The shadcn overlay overwrites that one file with the real shadcn Button, so counters never change for shadcn.
- Spreadsheet access on the server: `SpreadsheetApp.getActiveSpreadsheet()` → script property `SPREADSHEET_ID` → throw with a message naming the property.
- Not included: playwright, GitHub Actions, CLAUDE.md, AI tooling dirs, router, FSD layers.

## Overlays (`templates/`)

Copied in order; later files overwrite earlier ones. `package.json` files are deep-merged (deps, devDeps, scripts) instead of overwritten. `vite.config.ts` is generated by the CLI from the selected plugins. Everything else is real, lintable code. Files that need to differ per combination get a combo directory; no template engine.

| dir               | when              | contents                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`            | always            | everything framework-agnostic above                                                                                                                                                                                                                                                                                                                                                                         |
| `client-vanilla`  | client=vanilla    | `main.ts` with both counters                                                                                                                                                                                                                                                                                                                                                                                |
| `client-react`    | client=react      | `main.tsx`, `App.tsx`, `components/ClientCounter.tsx`, `ServerCounter.tsx`, `components/ui/button.tsx`                                                                                                                                                                                                                                                                                                      |
| `client-vue`      | client=vue        | `main.ts`, `App.vue`, `components/ClientCounter.vue`, `ServerCounter.vue`, `components/ui/Button.vue`; overlay `vite-env.d.ts` adds a `*.vue` module shim                                                                                                                                                                                                                                                   |
| `client-svelte`   | client=svelte     | `main.ts`, `App.svelte`, `components/ClientCounter.svelte`, `ServerCounter.svelte`, `components/ui/Button.svelte`; overlay `vite-env.d.ts` adds a `*.svelte` module shim                                                                                                                                                                                                                                    |
| `client-preact`   | client=preact     | `main.tsx`, `App.tsx`, `components/ClientCounter.tsx`, `ServerCounter.tsx`, `components/ui/Button.tsx`; overlay `tsconfig.client.json` (`jsx: react-jsx`, `jsxImportSource: preact`)                                                                                                                                                                                                                        |
| `tailwind`        | ui=tailwind       | `index.css` (`@import "tailwindcss"` + `@apply` for the semantic classes), devDeps `tailwindcss`, `@tailwindcss/vite`; vite plugin `tailwindcss()`                                                                                                                                                                                                                                                          |
| `shadcn`          | shadcn            | `components.json`, `src/client/lib/utils.ts`, `components/ui/button.tsx` (shadcn), `index.css` with shadcn theme vars, deps `cn`, `class-variance-authority`, `radix-ui` (what shadcn 4.x generates)                                                                                                                                                                                                        |
| `gsquery`         | gsquery           | `schema.gsq.yaml` (Notes: id @id @default(uuid), text string, createdAt datetime @default(now)), `src/server/db.ts`, `src/server/notes.ts`, api actions `listNotes`/`addNote`; deps `@gsquery/core`, devDep `@gsquery/cli`; scripts `generate` and `build`/`typecheck`/`dev` chained with generate (bun does not run pre-scripts); `src/server/generated/` gitignored; CLI runs generate once after install |
| `react-gsquery`   | react + gsquery   | `App.tsx` with Notes section, `components/Notes.tsx`                                                                                                                                                                                                                                                                                                                                                        |
| `vanilla-gsquery` | vanilla + gsquery | `main.ts` with Notes section                                                                                                                                                                                                                                                                                                                                                                                |
| `vue-gsquery`     | vue + gsquery     | `App.vue` with Notes section, `components/Notes.vue`                                                                                                                                                                                                                                                                                                                                                        |
| `svelte-gsquery`  | svelte + gsquery  | `App.svelte` with Notes section, `components/Notes.svelte`                                                                                                                                                                                                                                                                                                                                                  |
| `preact-gsquery`  | preact + gsquery  | `App.tsx` with Notes section, `components/Notes.tsx`                                                                                                                                                                                                                                                                                                                                                        |
| `gws-emul`        | gws-emul          | `src/client/api.ts` without mock fallback, deletes `mock.ts`; devDeps `@gws-emul/vite`, `@gws-emul/core`; vite plugin `gwsEmul({ backend: { entry: './src/server/index.ts' }, persist: {} })`                                                                                                                                                                                                               |

The gsquery example uses `@gsquery/core` on the server only (SheetsAdapter); no `@gsquery/client`.

## Build pipeline (`scripts/build.mjs`)

`scripts/build.mjs` only calls `buildWebApp()` from gas-app-kit (>= 0.2.0, create-gas-kit#2). That function owns the whole pipeline, so fixes reach every generated project through a dependency bump:

1. Client: programmatic `vite build` with the fixed output options passed inline (`cssCodeSplit=false`, `rollupOptions.output.codeSplitting=false`, `app.js` / `app.css`, `modulePreload=false`, large `assetsInlineLimit`), so the template's `vite.config.ts` carries only alias, dev server and the plugin list. Template literals are then lowered by an `esbuild.transform` post-step with `supported['template-literal']=false` (Vite 8 runs on Rolldown/oxc and ignores `esbuild` config options once `@vitejs/plugin-react` is present); residual backticks become `\u0060`.
2. Server: esbuild bundle `src/server/index.ts` (esm, es2019) → strip `export` statements / `import` lines → prepend banner from `collectBuildInfo` → `build/Code.gs`.
3. `build/index.html`: inline `<style>`, `<div id="app">`, `<?!= include('app') ?>`. `build/app.html`: `<script>` with `</script>` and `://` escaped.
4. Copy `appsscript.json` → `build/`.

`vite` and `esbuild` stay in the generated project's devDependencies: they are optional peers of gas-app-kit that `buildWebApp` loads on demand. Reference implementation before the move: `/Users/juhyeonni/.ghq/github.com/anesis-dx/gas-task-manager/scripts/build.mjs`.

## Setup (`scripts/setup.mjs`, `<pm> run setup`)

1. `clasp --version`; if not logged in (`clasp show-authorized-user --json`), run `clasp login` interactively.
2. Prompt env name (default `dev`).
3. Prompt: create new / connect existing (scriptId) / later.
   3a. Prompt web app access from a list: MYSELF / DOMAIN / ANYONE (default = current `appsscript.json` value, i.e. MYSELF on first run); written back to `appsscript.json` when changed. Fail-closed: `ANYONE` fails under many Workspace policies, `DOMAIN` is invalid for consumer accounts, so neither is a safe default.
4. Create: prompt type `standalone` | `sheets` (default `sheets` when gsquery selected), then `addEnv(name, { title: <project name>, type })` from gas-app-kit. Connect: `addEnv(name, { scriptId })`. Later: print `<pm> run setup`. After `addEnv`, set `allowLocalDeploy: true` on the new env via `loadEnvs`/`saveEnvs` (gas-app-kit defaults it to false; an env set up from a laptop is meant to be deployed from it).
5. Print editor / web-app URLs via gas-app-kit `editorUrl` / `webAppUrl`.

Prerequisite in gas-app-kit (`/Users/juhyeonni/.ghq/github.com/juhyeonni/gas-app-kit`): `AddEnvOptions.type` passed to `clasp create-script --type`, CLI flag `--type`. gas-app-kit 0.1.2 ships this; the template pins `^0.1.2`.

Missing-env errors on push/deploy are gas-app-kit's own messages; not wrapped.

## Verification

- CLI: `typecheck`, `lint`, `node --test` unit tests for composition (overlay selection, package.json merge, vite.config output).
- Integration (`test:integration`, slow): scaffold each of 7 combos into a temp dir, `pnpm install`, `typecheck`, `build`; assert `build/Code.gs`, `build/index.html`, `build/app.html`, `build/appsscript.json` exist and `app.html` contains no backtick. Combos: base (vanilla, none, all off), react, tailwind, shadcn (react+tailwind+shadcn), gsquery, gws-emul, all on.
- Manual: one real `gas-app push` to a GAS project (needs clasp login) before release. Not automated.

## Known risks

- gws-emul 0.2.0 surface is partial (e.g. `getRange` A1 notation unsupported). If gsquery + gws-emul dev breaks, simplify the demo query rather than patching gws-emul.
- `@gws-emul/vite` peer-depends on vite ^8; template pins vite 8.

## Deferred

- Solid client: not planned — nobody on the team uses Solid (decided 2026-09-06). If that changes, note that `vite-plugin-solid` had no stable Vite 8 release without solid-js 2.x at the time.
- Other UI frameworks, JS-only output.

## Order of work

1. This document.
2. gas-app-kit `--type` (separate repo, user publishes 0.1.2).
3. `templates/base` + `templates/client-vanilla` built by hand and verified with `pnpm install && pnpm typecheck && pnpm build` in a scratch copy.
4. CLI.
5. Overlays: react, tailwind, shadcn, gsquery, gws-emul, combo dirs.
6. Integration tests, CLI lint/typecheck.
7. Manual real-GAS smoke test.
