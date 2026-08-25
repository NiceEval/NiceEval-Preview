import { defineExperiment } from "niceeval";
import { deterministicAgent } from "../../agents/deterministic.ts";

export default defineExperiment({
  description: "Deterministic right Run for fixed View and Inspection dogfooding",
  agent: deterministicAgent,
  model: "inspection-right",
  flags: { dogfood: "inspection", side: "right", offline: true },
  labels: { fixture: "fixed-view", side: "right" },
  evals: ["states/pass"],
});
