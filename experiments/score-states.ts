import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../agents/deterministic.ts";

export default defineExperiment({
  description: "A skipped Score Attempt retained outside ranking",
  agent: deterministicAgent,
  model: "preview-baseline",
  flags: { condition: "score-states", offline: true },
  labels: { line: "score-states", condition: "skipped" },
  evals: ["score/rubric/skipped"],
});
