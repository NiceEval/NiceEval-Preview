# NiceEval Preview

This repository is the deterministic data source for the NiceEval Report preview. It is a real, standalone NiceEval consumer: all examples use public package exports and all committed data under `.niceeval/record/` was produced through the public CLI.

The committed Record is enough to render the full static site. Rendering never starts Docker, reads a secret, contacts a provider, or makes a paid model call. Docker is needed only when deliberately regenerating the two Sandbox lanes.

## Requirements

- Node.js 24 or newer
- pnpm 11.18.0
- Docker only for `pnpm record:generate`; the immutable image in [`sandboxes/node.ts`](sandboxes/node.ts) must already be cached

## Feature map

| Feature | Definition / experiment | Durable Report evidence |
| --- | --- | --- |
| Rich Direct Agent events | `agents/deterministic.ts`, `gallery/events` | Report conversation items for messages, ordinary tool, command projection, subagent start/finish, `skill.loaded`, context injection, and recoverable error; Assertions additionally retain thinking/compaction presence, diagnostics, data, usage, and observed cost |
| Files, turns, and sessions | `gallery/events` | `sendFile`, two turns in one session, a separate session, turn/session/attempt assertion scopes, tool/event order and counts |
| Human input | `gallery/hitl` | a real `waiting` turn, `input.requested`, `requireInputRequest`, structured `respond`, plus pending and completed tool evidence across the two turns; token usage is retained while observed cost is intentionally absent to exercise partial cost comparison |
| Pass gallery | `states/pass`, `gallery/*` | normal passed Verdicts and comparable Pass-only populations |
| Failed / errored / skipped | `pass-states`, `score-states` | one deliberate failed Assertion, one thrown error, one explicit Pass skip, and one separately admitted Score skip |
| Score lifecycle | `score/rubric/{complete,zero,stopped,skipped}` | complete score, complete zero, mismatch-as-zero, direct score, measurement threshold, and points retained across `orStop` |
| Assertion policy | `gallery/events`, `states/pass`, `score/rubric/complete` | `t.group`, key, label, optional, gate, `atLeast`, `orStop`, positive/negative tool and event checks, no-tools/no-failed-actions checks, and turn/session/attempt scopes |
| Complete public matcher gallery | `score/matchers` | matched and mismatched entries for `includes`, `excludes`, `pattern`, `includesUrl`, `hasSections`, `isDefined`, `isTrue`, `isFalse`, `equals`, `matches`, `satisfies`, `defineValueMatch`, `jsonMatch`, `referencesAnyPath`, `and`, `or`, `not`, `similarity`, `defineScoreMatch`, `commandSucceeded`, `toolMatch`, `commandMatch`, and `eventMatch` |
| Offline Judge failure | `judge-unavailable` | declared Judge capability with no model configuration, retained as an unavailable/errored reason without a network call |
| Eval Group Sandbox lane | `sandbox-group` | two Eval Group members share one Docker lane; `runCommand`, `runShell`, text/byte file IO, `changedPaths`, `fileChanged`, `fileDeleted`, and `notInDiff` |
| Independent Sandbox reuse lane | `sandbox-reuse` | two attempts reuse/reset one Sandbox outside an Eval Group and prove the prior attempt's file is absent |
| Comparable Experiments | `pass-gallery/{baseline,candidate}`, `score-gallery/{baseline,candidate}` | separate same-kind groups with different model, reasoning, flags, labels, attempts, early-exit policy, and explicit-versus-predicate Eval selection |
| Additional Experiment shapes | `pass-states`, `score-states`, `judge-unavailable`, `sandbox-group`, `sandbox-reuse` | root singletons, Eval selector, homogeneous Eval Group, Sandbox reuse, and separate Pass/Score populations |
| Record reuse | the two committed `pass-gallery/baseline` Runs | the second identical invocation publishes carried/reused members rather than silently skipping a Run |

## Use the published package

The repository keeps `niceeval: ^0.13.3` as its public dependency baseline.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
```

This proves that the source remains a valid consumer of the published public
exports. The committed Record is written by the current candidate and may
intentionally use a format newer than `0.13.3`; the older CLI can therefore
reject the Record before discovery. Run CLI discovery and rendering only after
linking the candidate as described next.

## Link a sibling NiceEval checkout

Use this when validating an unreleased candidate. From this repository, with a sibling candidate checkout at `../NiceEval`:

```bash
pnpm --dir ../NiceEval dev:link "$PWD"
pnpm typecheck
pnpm exec niceeval list
pnpm exec niceeval exp list
pnpm exec niceeval view --out .preview
```

Open `.preview/index.html` through a static file server, or publish `.preview/` as the Netlify directory. A preview CI job needs only this repository clone, an install followed by the candidate link above, and `niceeval view --out`; it does not regenerate data or start Docker.

`dev:link` deliberately adds a workspace override and rewrites the lockfile. Those are local test inputs, not repository state. After validation, restore `pnpm-workspace.yaml` to its checked-in public form (remove the `overrides` block), then run `pnpm install` so the lockfile resolves `niceeval` from the registry again. Do not commit a `link:` dependency.

## Regenerate the Record

Regeneration is offline, but it executes Docker for the two Sandbox experiments. Ensure the fixed digest image in `sandboxes/node.ts` is already cached; the intentionally invalid registry hostname makes an accidental pull fail instead of contacting a registry.

```bash
pnpm record:generate
```

The script starts a fresh `.niceeval` generation epoch, runs both Pass gallery members and both Score gallery members, accepts exit code `1` only for the explicit Pass state and Judge galleries, checks the successful Score skip separately, runs the homogeneous Eval Group and independent `sandboxReuse` lanes, and finally runs `pass-gallery/baseline` a second time. Any unexpected exit code or missing marker fails the script.

Confirm that the final invocation is truly reusable:

```bash
pnpm exec niceeval exp pass-gallery/baseline --dry --json
```

The JSON plan must contain `"state":"reuse"` slots and a non-zero `reused` count. Running the same experiment once more must print a carried-in count:

```bash
pnpm record:reuse
```

## Inspect through public Report commands

Do not inspect `.niceeval/record` files directly. Use the Report API exposed by the CLI:

```bash
pnpm exec niceeval show --experiment pass-gallery/baseline
pnpm exec niceeval show --experiment pass-gallery/candidate
pnpm exec niceeval show --experiment score-gallery/baseline
pnpm exec niceeval show --experiment score-gallery/candidate
pnpm exec niceeval show --experiment pass-states
pnpm exec niceeval show --experiment score-states
pnpm exec niceeval show --experiment judge-unavailable
pnpm exec niceeval show --experiment sandbox-group
pnpm exec niceeval show --experiment sandbox-reuse
pnpm exec niceeval show --experiment pass-gallery/candidate --json
pnpm exec niceeval view --out .preview
```

The JSON form exposes the unique matcher labels (for example `eventMatch:matched` and `eventMatch:mismatched`), `skill-load` conversation items, diagnostics, score contributions, Eval Group identity, and origin/reference membership for carried Runs.

## Repository boundaries

- No example imports NiceEval private source or reads private Record files.
- The Direct Agents do not call `fetch`, inspect environment secrets, or configure a provider.
- The fixed Docker image is used only while generating Record data.
- `.niceeval/record/` is committed; coordination, caches, kept sandboxes, dependencies, static output, and local link traces are ignored.
- Its scripts do not create remotes, push, publish, or send external messages.
