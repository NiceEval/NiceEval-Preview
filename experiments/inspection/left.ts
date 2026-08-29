import { defineExperiment } from "niceeval";
import { PREVIEW_CODEX_MODEL, previewCodexAgent } from "../../agents/codex.ts";
import { previewNodeSandbox } from "../../sandboxes/node.ts";

export default defineExperiment({
  description: "Real Codex left Run for View and Inspection dogfooding",
  agent: previewCodexAgent,
  model: PREVIEW_CODEX_MODEL,
  sandbox: previewNodeSandbox(),
  flags: { dogfood: "inspection", side: "left", runtime: "codex" },
  labels: { fixture: "fixed-view", side: "left" },
  evals: ["states/pass"],
});
