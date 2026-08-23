import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../agents/deterministic.ts";

export default defineExperiment({
  description: "One deterministic population containing passed, failed, errored, and skipped Verdicts",
  agent: deterministicAgent,
  model: "preview-baseline",
  flags: { condition: "states", offline: true },
  labels: { line: "states", condition: "four-verdicts" },
  evals: [
    "states/pass",
    "states/failed",
    "states/errored",
    "states/skipped",
    "score/rubric/skipped",
  ],
});
