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

## Static ViewRevision preview

`niceeval-candidate.sha` is the only candidate pin. It names an exact lowercase
approved NiceEval commit; both GitHub CI and Netlify invoke the same
`preview:build` command, which clones that SHA, builds the package, and applies
the repository-owned consumer link only to a disposable copy of this consumer
while building. The working checkout and its installed dependency graph remain
unchanged.

```bash
pnpm preview:build
pnpm preview:verify
```

The build reuses the deterministic sealed fixture, opens only the installed
public `niceeval view --record` loopback, completes the one-time credential
exchange, then recursively copies the fixed revision's discovered same-origin
assets byte-for-byte into `.preview-site/`. It never imports candidate
`dist` files or creates its own HTML, navigation, renderer, or interpretation.
The verifier permits only discovered static ViewRevision file types and rejects
SQLite, Inspection JSON, `.niceeval`, credentials, and unexpected paths.

For an authorized parent-agent final acceptance of an unreleased candidate
already linked into this repository, run the same build without replacing that
link:

```bash
NICEEVAL_PREVIEW_USE_INSTALLED_CANDIDATE=1 pnpm preview:build
pnpm preview:verify
```

`netlify.toml` replaces the payload of the existing
`niceeval-report-preview` Netlify site/check: it runs the command above with
Node 24 and publishes only `.preview-site/`. The historical external name can
remain stable while the product it deploys becomes the fixed first-party View.
The repository does not create or reconfigure the site, and no local script
deploys or calls Netlify.

## Boundaries

- Facts belong to the sealed Record; the snapshot is the only portable input.
- Inspection owns selector, cutoff, missing facts, evidence, and comparison.
- View and query independently consume closed Inspection results.
- This repository contains no custom static preview, HTML export, `show`,
  `insight`, Analysis, Report, custom page, or presentation extension. Its
  deployment step republishes only bytes emitted by the fixed ViewRevision.

The scripts do not create remotes, push, publish, start Docker, or call an AI
provider.
