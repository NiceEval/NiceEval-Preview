import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "Low-cost, low-quality Score gallery baseline",
  agent: deterministicAgent,
  model: "preview-score-low",
  reasoningEffort: "low",
  flags: { condition: "low", offline: true },
  labels: { line: "score-gallery", condition: "low", rank: "low" },
  attempts: 2,
  earlyExit: true,
  maxConcurrency: 1,
  evals: [
    "score/gallery-low",
  ],
});
