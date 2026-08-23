import { defineEvalGroup } from "niceeval";
import { previewNodeSandbox } from "../../../sandboxes/node.ts";
import alpha from "./alpha.eval.ts";
import beta from "./beta.eval.ts";

export default defineEvalGroup({
  evals: [beta, alpha],
  sandbox: previewNodeSandbox(),
  onUnavailable: "stop-group",
});
