# Repository instructions

This repository is a declaration-only, real Preview data consumer. NiceEval
owns the candidate, Netlify site/check, reader, Inspection, first-party View,
View assets, links, and UI; this repository owns the declared Experiments and
one human-reviewed, tracked sealed `RecordSnapshot`.

- Keep eval and Agent imports on public `niceeval`, `niceeval/adapter`, and
  `niceeval/expect` exports. Never import a sibling checkout's source files.
- There are no repository orchestration scripts or CI. A maintainer refreshes
  locally via `pnpm exec niceeval exp list --json`, selector-free
  `pnpm exec niceeval exp --rerun all`, then
  `pnpm exec niceeval record snapshot --output snapshot/record.sqlite`.
  Review the operational Record via public `niceeval query`, `niceeval show`,
  and `niceeval view` before export. The NiceEval repository's Preview build
  resolves the latest `origin/main`, records that exact commit in its build
  receipt, then validates and reads the sealed snapshot.
- The deterministic Direct Agent is offline and provider-free: it must not read
  secrets, call providers, use `fetch`, or access the network. Do not claim the
  full fixture is Docker-free: the declared sandbox Experiments use the
  deterministic Sandbox Agent and real `dockerSandbox` execution.
- Read Record facts only through `niceeval record snapshot`, `niceeval query`,
  and `niceeval view`. Do not read `.niceeval/` or a snapshot as a private
  data format.
- `query` is for AI and CI. `view` is for people. Do not add `show`,
  `insight`, Report/Page/Analysis definitions, custom themes, renderers, or
  static HTML export.
- Keep `package.json` on the public `niceeval` range. A parent agent may link
  an unreleased candidate only for final acceptance; remove any temporary
  workspace override and `link:` lock entries before committing.
- `.niceeval/` is generated local state. Never commit an operational Record,
  copied SQLite database, static output directory, query scratch file, View
  asset directory, credential, or `.env`. The only exception is the CLI-created
  sealed snapshot at `snapshot/record.sqlite`.
- Do not fabricate a SQLite snapshot or a handwritten receipt. The path's
  metadata documents the contract only; the real artifact must be produced by
  `niceeval record snapshot` after a full local run.
- The `niceeval-report-preview` Netlify site is bound to `NiceEval/NiceEval`.
  NiceEval `main` owns the stable URL and each NiceEval PR owns its native
  Deploy Preview. This repository must not contain `netlify.toml`, a Netlify
  build hook/secret, or a workflow that can deploy the site.
- Preserve unknown changes. Do not use reset, restore, checkout, stash, or
  clean to discard work. Do not create remotes, push, publish, or send
  external messages.

Minimum local refresh and review after a compatible public candidate is
installed:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm exec niceeval exp list --json
pnpm exec niceeval exp --rerun all
pnpm exec niceeval query discover
pnpm exec niceeval view --no-open --port 0 --json
pnpm exec niceeval record snapshot --output snapshot/record.sqlite
git status --short
```
