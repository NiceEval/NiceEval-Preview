import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "Score gallery candidate selected by Eval metadata/tags with full attempts",
  agent: deterministicAgent,
  model: "preview-candidate",
  reasoningEffort: "medium",
  flags: { condition: "candidate", offline: true, richerContext: true },
  labels: { line: "score-gallery", condition: "candidate", rank: "candidate" },
  attempts: 2,
  earlyExit: false,
  evals: (evalDescriptor) =>
    evalDescriptor.evaluationKind === "score" && evalDescriptor.tags.includes("gallery"),
});
