# Repository instructions

This repository is a declaration-only, real Preview data consumer. NiceEval
owns the candidate, Netlify site/check, reader, Inspection, first-party View,
View assets, links, and UI; this repository owns the declared Experiments and
one human-reviewed, tracked canonical `.niceeval/record.sqlite`.

- Keep eval and Agent imports on public `niceeval`, `niceeval/adapter`, and
  `niceeval/expect` exports. Never import a sibling checkout's source files.
- There are no repository orchestration scripts or CI. A maintainer refreshes
  locally via `pnpm exec niceeval exp list --json` and selector-free
  `pnpm exec niceeval exp --rerun all`. A successful graceful exit closes and
  checkpoints the canonical Record; there is no separate export step. Review
  it via public `niceeval query`, `niceeval show`, and `niceeval view`. The
  NiceEval repository's Preview build resolves the latest `origin/main`, records
  that exact commit in its build receipt, then validates and reads the Record.
- The deterministic Direct Agent is offline and provider-free: it must not read
  secrets, call providers, use `fetch`, or access the network. Do not claim the
  full fixture is Docker-free: the declared sandbox Experiments use the
  deterministic Sandbox Agent and real `dockerSandbox` execution.
- Read Record facts only through `niceeval query`, `niceeval show`, and
  `niceeval view`. Do not inspect SQLite as a private data format.
- `query` is for AI and CI. `view` is for people. Do not add `show`,
  `insight`, Report/Page/Analysis definitions, custom themes, renderers, or
  static HTML export.
- Keep `package.json` on the public `niceeval` range. A parent agent may link
  an unreleased candidate only for final acceptance; remove any temporary
  workspace override and `link:` lock entries before committing.
- `.niceeval/record.sqlite` is the sole tracked product Record. Never commit
  WAL/SHM files, staging databases, locks, static output, query scratch files,
  View assets, credentials, or `.env`.
- Do not fabricate or copy a database. The tracked Record must be produced by
  the selector-free full run and left portable by NiceEval's automatic graceful
  shutdown. A Run may remain active; only atomically published Attempts are visible.
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
pnpm exec niceeval view --no-open --port 41739
git status --short
```
