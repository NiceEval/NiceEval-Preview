import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "Medium-cost Score gallery condition with a materially higher quality",
  agent: deterministicAgent,
  model: "preview-score-medium",
  reasoningEffort: "medium",
  flags: { condition: "medium", offline: true, richerContext: true },
  labels: { line: "score-gallery", condition: "medium", rank: "medium" },
  attempts: 2,
  earlyExit: false,
  evals: ["score/rubric/complete"],
});
