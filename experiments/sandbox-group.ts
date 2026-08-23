import { defineExperiment } from "niceeval";
import { deterministicSandboxAgent } from "../agents/sandbox.ts";

export default defineExperiment({
  description: "Two Eval Group members share one capacity-one Docker Sandbox lane",
  agent: deterministicSandboxAgent,
  model: "preview-sandbox",
  flags: { lane: "eval-group", offline: true },
  labels: { line: "sandbox", lane: "eval-group" },
  evals: ["sandbox/group"],
  maxConcurrency: 2,
});
