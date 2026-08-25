import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "Deterministic left Run for fixed View and Inspection dogfooding",
  agent: deterministicAgent,
  model: "inspection-left",
  flags: { dogfood: "inspection", side: "left", offline: true },
  labels: { fixture: "fixed-view", side: "left" },
  evals: ["states/pass"],
});
