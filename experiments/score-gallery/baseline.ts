import { defineExperiment } from "niceeval";
import { PREVIEW_CODEX_MODEL, previewCodexAgent } from "../../agents/codex.ts";
import { previewNodeSandbox } from "../../sandboxes/node.ts";

export default defineExperiment({
  description: "Low-cost, low-quality Score gallery baseline",
  agent: previewCodexAgent,
  model: PREVIEW_CODEX_MODEL,
  sandbox: previewNodeSandbox(),
  reasoningEffort: "low",
  flags: { condition: "low", runtime: "codex" },
  labels: { line: "score-gallery", condition: "low", rank: "low" },
  attempts: 2,
  earlyExit: true,
  maxConcurrency: 1,
  evals: [
    "score/gallery-low",
  ],
});
