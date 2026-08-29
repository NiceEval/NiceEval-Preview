import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "Distinct high-cost, lower-quality Score gallery condition",
  agent: deterministicAgent,
  model: "preview-score-divergent",
  reasoningEffort: "medium",
  flags: { condition: "divergent", offline: true, alternateStrategy: true },
  labels: { line: "score-gallery", condition: "divergent", rank: "divergent" },
  attempts: 2,
  earlyExit: false,
  evals: ["score/gallery-divergent"],
});
