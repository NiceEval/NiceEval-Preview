import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../agents/deterministic.ts";

export default defineExperiment({
  description: "Declared Judge capability without model/key: zero-network unavailable evidence",
  agent: deterministicAgent,
  model: "preview-baseline",
  flags: { condition: "judge-unavailable", offline: true },
  labels: { line: "judge", condition: "unconfigured" },
  evals: ["judge/unavailable"],
});
