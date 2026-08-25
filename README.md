# NiceEval Preview

This repository is a deterministic downstream dogfood for NiceEval's fixed
post-run interfaces. It proves one sealed Record can feed both audiences:

```text
deterministic Eval Runs → sealed Record → RecordSnapshot → query | View
```

`niceeval query` is the versioned machine interface for AI and CI.
`niceeval view` is the fixed loopback interface for a human reader. Neither
interface loads a project Report, page, component, renderer, or theme.

## Requirements

- Node.js 24 or newer
- pnpm 11.18.0
- A NiceEval runtime that provides `record snapshot`, `query`, and the fixed
  loopback `view`

The fixture itself makes no paid model call, performs no Docker work, and uses
an offline deterministic Direct Agent.

## Dogfood

Install the public dependency to typecheck the consumer:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
```

The published baseline can predate the new Record and Inspection commands. For
final acceptance, the parent task links the compatible NiceEval candidate, then
runs this one command from this repository:

```bash
pnpm dogfood:inspection
```

The command creates an isolated temporary consumer project and runs two direct
deterministic experiments (`inspection/left` and `inspection/right`). It never
deletes or reuses this checkout's existing `.niceeval` data. It seals the Runs,
exports a sealed-only `RecordSnapshot`, and uses that snapshot for every read.
It then:

1. runs `niceeval query discover` and requires all fixed operations;
2. sends a legal `niceeval.query/v1` request for `runs.list`, `run.get`,
   `run.summary`, `attempt.get`, `attempt.trace`, `attempt.diff`,
   `attempt.sources`, `attempt.artifacts`, and `runs.compare`;
3. accepts only successful canonical query documents, including explicit
   closed `not-recorded` states where this direct fixture has no fact;
4. starts `niceeval view --record … --no-open --port 0 --json`, completes its
   one-time loopback credential exchange, verifies the fixed Overview shell,
   then sends `SIGTERM` and requires the terminal `closed` lifecycle event.

The Record and snapshot are temporary local inputs. A raw operational SQLite
file, its copy, and arbitrary external files are never passed to `--record`.

## Boundaries

- Facts belong to the sealed Record; the snapshot is the only portable input.
- Inspection owns selector, cutoff, missing facts, evidence, and comparison.
- View and query independently consume closed Inspection results.
- This repository contains no static preview, HTML export, `show`, `insight`,
  Analysis, Report, custom page, or presentation extension.

The scripts do not create remotes, push, publish, start Docker, or call an AI
provider.
