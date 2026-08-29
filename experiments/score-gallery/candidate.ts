import { defineExperiment } from "niceeval";
import { PREVIEW_CODEX_MODEL, previewCodexAgent } from "../../agents/codex.ts";
import { previewNodeSandbox } from "../../sandboxes/node.ts";

export default defineExperiment({
  description: "Medium-cost Score gallery condition with a materially higher quality",
  agent: previewCodexAgent,
  model: PREVIEW_CODEX_MODEL,
  sandbox: previewNodeSandbox(),
  reasoningEffort: "medium",
  flags: { condition: "medium", runtime: "codex", richerContext: true },
  labels: { line: "score-gallery", condition: "medium", rank: "medium" },
  attempts: 2,
  earlyExit: false,
  evals: ["score/rubric/complete"],
});
