# Repository instructions

This repository dogfoods NiceEval's fixed first-party View and machine
Inspection. It is a real public-package consumer, not a Report or page
fixture. It also owns only the static deployment orchestration for a sealed
ViewRevision; NiceEval owns the reader, Inspection, renderer, links, and UI.

- Keep eval and Agent imports on public `niceeval`, `niceeval/adapter`, and
  `niceeval/expect` exports. Never import a sibling checkout's source files.
- The only product-facing dogfood command is `pnpm dogfood:inspection`. It
  creates two sealed deterministic Runs, exports a `RecordSnapshot`, discovers
  the fixed query catalog, runs every fixed operation, and verifies a loopback
  `niceeval view` lifecycle.
- The dogfood path is deterministic: its Direct Agent must not read secrets,
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
- `niceeval-candidate.sha` is the one repository truth for a static Preview
  candidate. It must be one lowercase 40-character approved NiceEval commit;
  GitHub CI and Netlify both read it through `preview:build`.
  Do not add a workflow input, Netlify environment override, `link:` lockfile
  entry, or a second SHA source.
- `pnpm preview:build` creates the sealed deterministic fixture, opens the
  installed public `niceeval view --record` loopback, exchanges its one-time
  credential, and copies only discovered same-origin ViewRevision bytes into
  `.preview-site/`. It never publishes the Record, Inspection JSON, `.niceeval`,
  session cookie, credential, or a locally authored page. `pnpm preview:verify`
  rejects anything outside the static allowlist.
- The default static build obtains and builds the exact pinned candidate, then
  applies the main repository's `consumer:link` to a disposable copy of this
  consumer only for the build. It never rewrites this checkout's manifest,
  lockfile, workspace declaration, or `node_modules`. A parent agent may set
  `NICEEVAL_PREVIEW_USE_INSTALLED_CANDIDATE=1`
  after an authorized final candidate link for local acceptance; that override
  is never used by CI or Netlify and must not be committed.
- Keep the existing `niceeval-report-preview` Netlify site/check as the stable
  deployment identity, but replace its payload with this fixed ViewRevision
  build. After the allowlist check passes, GitHub Actions may invoke only the
  scoped `NETLIFY_BUILD_HOOK_URL` secret. Repository automation must not carry
  a Netlify auth token, create sites, or reconfigure the existing site.
- Preserve unknown changes. Do not use reset, restore, checkout, stash, or
  clean to discard work. Do not create remotes, push, publish, or send
  external messages.

Minimum portable check after the compatible candidate has been linked:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm dogfood:inspection
pnpm preview:build
pnpm preview:verify
git status --short
```
