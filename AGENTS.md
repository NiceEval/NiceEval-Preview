# Repository instructions

This repository dogfoods NiceEval's fixed first-party View and machine
Inspection. It is a real public-package consumer, not a Report or page
fixture.

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
- Preserve unknown changes. Do not use reset, restore, checkout, stash, or
  clean to discard work. Do not create remotes, push, publish, or send
  external messages.

Minimum portable check after the compatible candidate has been linked:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm dogfood:inspection
git status --short
```
