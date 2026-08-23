# Repository instructions

This repository is a standalone public consumer and deterministic Report fixture for NiceEval.

- Keep all eval, experiment, Agent, Sandbox, and Report interactions on public `niceeval`, `niceeval/adapter`, `niceeval/expect`, and `niceeval/sandbox` exports. Never import a sibling checkout's source files.
- Validate Record behavior only with `niceeval list`, `niceeval exp`, `niceeval show`, and `niceeval view`. Do not inspect or derive expectations from `.niceeval/record` internals.
- Preserve the offline contract. Direct Agents must not read secrets, call providers, use `fetch`, or access the network. The intentionally invalid Docker registry name must remain paired with the cached immutable digest.
- Static preview rendering must work from the committed Record without Docker or secrets. Docker belongs only to explicit Record regeneration.
- Keep `package.json` on the public `niceeval` range. A sibling `pnpm dev:link` may temporarily add a workspace override and `link:` lock entries; remove the override with an explicit edit and run normal `pnpm install` before committing. Do not use reset, restore, checkout, stash, or clean to discard changes.
- Regenerate with `pnpm record:generate`. The state and Judge experiments intentionally exit `1`; only the checked helper may accept that exact status and its named output evidence.
- Preserve matched and mismatched persisted Score entries for every public matcher exported by `niceeval/expect`; a new public matcher requires a labeled pair here.
- Preserve the two mutually exclusive Sandbox shapes: an Eval Group owns the shared Group lane, while the separate experiment owns the `sandboxReuse` lane. Never combine Group membership with experiment `sandboxReuse`.
- Commit `.niceeval/record/` but never coordination state, caches, dependencies, `.preview/`, kept sandboxes, or local link traces.

Minimum portable checkout checks:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm exec niceeval list
pnpm exec niceeval exp list
git status --short
```

After linking the current sibling candidate, also run `niceeval exp gallery/baseline --dry --json` and `niceeval view --out .preview`. The public dependency may predate the committed Record format, so static rendering is a candidate-link check.
