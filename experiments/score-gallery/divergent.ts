import { defineExperiment } from "niceeval";
import { PREVIEW_CODEX_MODEL, previewCodexAgent } from "../../agents/codex.ts";
import { previewNodeSandbox } from "../../sandboxes/node.ts";

export default defineExperiment({
  description: "Distinct high-cost, lower-quality Score gallery condition",
  agent: previewCodexAgent,
  model: PREVIEW_CODEX_MODEL,
  sandbox: previewNodeSandbox(),
  reasoningEffort: "medium",
  flags: { condition: "divergent", runtime: "codex", alternateStrategy: true },
  labels: { line: "score-gallery", condition: "divergent", rank: "divergent" },
  attempts: 2,
  earlyExit: false,
  evals: ["score/gallery-divergent"],
});
