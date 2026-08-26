# Repository instructions

This repository dogfoods NiceEval's fixed first-party View and machine
Inspection. It is a real public-package consumer, not a Report or page
fixture. NiceEval owns the candidate, Netlify site/check, reader, Inspection,
renderer, links, and UI; this repository owns only the controlled consumer
fixture and its ViewRevision build/verification commands.

- Keep eval and Agent imports on public `niceeval`, `niceeval/adapter`, and
  `niceeval/expect` exports. Never import a sibling checkout's source files.
- The only product-facing dogfood command is `pnpm dogfood:inspection`. It
  creates two sealed controlled Runs, exports a `RecordSnapshot`, discovers
  the fixed query catalog, runs every fixed operation, and verifies a loopback
  `niceeval view` lifecycle.
- The dogfood path is offline and provider-free: its Direct Agent must not read secrets,
  call providers, use `fetch`, or access the network. It must not invoke
  Docker or a Sandbox.
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
  copied SQLite database, static output directory, or query scratch file.
- `pnpm preview:build` creates the sealed controlled fixture, opens the
  installed public `niceeval view --record` loopback, exchanges its one-time
  credential, and copies only discovered same-origin ViewRevision bytes into
  `.preview-site/`. It never publishes the Record, Inspection JSON, `.niceeval`,
  session cookie, credential, or a locally authored page. `pnpm preview:verify`
  rejects anything outside the static allowlist.
- `pnpm preview:build` always consumes the `niceeval` package installed in this
  checkout. NiceEval's repository-owned Preview command clones an exact commit
  of this repository into a disposable directory and installs one exact packed
  candidate before invoking it. Do not add a reverse NiceEval candidate pin,
  `link:` lockfile entry, ambient candidate override, or repository-owned
  deployment trigger.
- The `niceeval-report-preview` Netlify site is bound to `NiceEval/NiceEval`.
  NiceEval `main` owns the stable URL and each NiceEval PR owns its native
  Deploy Preview. This repository must not contain `netlify.toml`, a Netlify
  build hook/secret, or a workflow that can deploy the site.
- Preserve unknown changes. Do not use reset, restore, checkout, stash, or
  clean to discard work. Do not create remotes, push, publish, or send
  external messages.

Minimum portable check after a compatible candidate has been installed:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm dogfood:inspection
pnpm preview:build
pnpm preview:verify
git status --short
```
