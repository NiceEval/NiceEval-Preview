import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "High-cost Score gallery condition with a small quality improvement",
  agent: deterministicAgent,
  model: "preview-score-high",
  reasoningEffort: "high",
  flags: { condition: "high", offline: true, richerContext: true },
  labels: { line: "score-gallery", condition: "high", rank: "high" },
  attempts: 2,
  earlyExit: false,
  evals: ["score/gallery-high"],
});
