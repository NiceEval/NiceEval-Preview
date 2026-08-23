import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "Gallery baseline with strict sequential early exit",
  agent: deterministicAgent,
  model: "preview-baseline",
  reasoningEffort: "low",
  flags: { condition: "baseline", offline: true },
  labels: { line: "preview", condition: "baseline", rank: "baseline" },
  attempts: 2,
  earlyExit: true,
  maxConcurrency: 1,
  evals: [
    "gallery/events",
    "gallery/hitl",
    "score/matchers",
    "score/rubric/complete",
    "score/rubric/stopped",
    "score/rubric/zero",
  ],
});
