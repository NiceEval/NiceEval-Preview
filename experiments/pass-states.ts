import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../agents/deterministic.ts";

export default defineExperiment({
  description: "Pass Attempts covering passed, failed, errored, and skipped Verdicts",
  agent: deterministicAgent,
  model: "preview-baseline",
  flags: { condition: "pass-states", offline: true },
  labels: { line: "pass-states", condition: "four-verdicts" },
  evals: ["states/pass", "states/failed", "states/errored", "states/skipped"],
});
