import { defineExperiment } from "niceeval";
import { PREVIEW_CODEX_MODEL, previewCodexAgent } from "../../agents/codex.ts";
import { previewNodeSandbox } from "../../sandboxes/node.ts";

export default defineExperiment({
  description: "High-cost Score gallery condition with a small quality improvement",
  agent: previewCodexAgent,
  model: PREVIEW_CODEX_MODEL,
  sandbox: previewNodeSandbox(),
  reasoningEffort: "high",
  flags: { condition: "high", runtime: "codex", richerContext: true },
  labels: { line: "score-gallery", condition: "high", rank: "high" },
  attempts: 2,
  earlyExit: false,
  evals: ["score/gallery-high"],
});
