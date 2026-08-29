# NiceEval Preview

This is a declaration-only, real Preview data repository. Its committed product
input is exactly one canonical SQLite Record at `.niceeval/record.sqlite`.
NiceEval owns the reader, Inspection,
first-party View, View assets, and Netlify deployment; this repository owns the
declared Experiments and the reviewed Record.

```text
all declared Experiments → .niceeval/record.sqlite → query | view
```

There are no JavaScript orchestration scripts and no CI in this repository.
Maintainers regenerate the Record locally with the public CLI, review its
effects, then manually commit and push it. Staging databases, WAL/SHM files,
query scratch data, and View assets remain untracked.

## Local refresh contract

Requirements: Node.js 24+, pnpm 11.18.0, Docker available for the sandbox
Experiments, and a compatible installed public `niceeval` package. Credentials
come only from the maintainer's local environment or untracked `.env`; never
read, print, copy, or commit `.env`.

Start by installing and typechecking the consumer:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
```

Discover the complete declared Experiment catalog before spending provider or
Docker resources. Do not add an Experiment/eval selector, tag filter, or a
repository-maintained selection list:

```bash
pnpm exec niceeval exp list --json
```

Regenerate every discovered Experiment, including results that would otherwise
be reused, with the selector-free command verified from the installed CLI:

```bash
pnpm exec niceeval exp --rerun all
```

Review the canonical Record through NiceEval's public readers.
`view` prints a local URL whose credential must not be copied into output,
logs, or commits. Stop the local View after review.

```bash
pnpm exec niceeval query discover
pnpm exec niceeval view --no-open --port 41739
```

The invocation's graceful exit closes its writer, checkpoints and truncates the
WAL, and validates `.niceeval/record.sqlite` for direct movement. There is no
snapshot/export/compact/verify step. Runs may remain active; only atomically
published Attempts are visible to readers.

## Public-CLI review and handoff

Do not inspect the Record as a private SQLite format. The NiceEval repository
resolves the latest Preview `origin/main`, records its exact commit in the build
receipt, imports the Record as hostile SQLite, and loads it
with the current candidate View.

```bash
git status --short
```

Inspect the diff and status, including the single Record, then the maintainer
manually commits and pushes the reviewed changes. This repository never commits
or pushes on their behalf.

## Fixture execution facts

Most Experiments use the offline deterministic Direct Agent. It makes no
provider call and does not use Docker. This does **not** make the complete
refresh Docker-free: `sandbox-group` and `sandbox-reuse` use the deterministic
Sandbox Agent with NiceEval's `dockerSandbox` and the pinned Node 24 image.
Accordingly, a full `exp --rerun all` may pull/use Docker while still making no
AI-provider call. The fixture is intentionally not converted to a provider
agent.

## Boundaries

- The tracked `.niceeval/record.sqlite` is the one portable input;
  it may contain sensitive Run content and needs human review before commit.
- `query` is for machine inspection; `show` and `view` are public human review
  surfaces. All read sealed facts only.
- No Report, Page, Analysis, custom renderer, theme, HTML export, static-site
  build, Netlify configuration, deployment hook, or CI belongs here.
- NiceEval itself owns publication atomicity and graceful portability. This
  repository does not maintain a second receipt or export format.
