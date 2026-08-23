import { defineExperiment } from "niceeval";
import { deterministicSandboxAgent } from "../agents/sandbox.ts";
import { previewNodeSandbox } from "../sandboxes/node.ts";

export default defineExperiment({
  description: "Independent sandboxReuse experiment with two sequential Attempts",
  agent: deterministicSandboxAgent,
  model: "preview-sandbox",
  flags: { lane: "sandbox-reuse", offline: true },
  labels: { line: "sandbox", lane: "sandbox-reuse" },
  sandbox: previewNodeSandbox(),
  sandboxReuse: true,
  attempts: 2,
  maxConcurrency: 1,
  evals: ["sandbox/reuse"],
});
