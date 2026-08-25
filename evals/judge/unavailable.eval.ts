import { defineEval } from "niceeval";
import { closedQA, type JudgeMaterial } from "niceeval/expect";

export default defineEval({
  description: "Judge capability without model configuration: zero-network unavailable path",
  tags: ["judge", "state", "unavailable"],
  judge: true,
  async test(t) {
    const turn = await t.send("preview/state/judge-unavailable");
    turn.succeeded().label("Direct Agent completed before Judge evaluation");
    const material: JudgeMaterial = { input: turn.input, output: turn.message };
    turn.check(material, closedQA("Does the reply name judge-unavailable?").atLeast(1))
      .gate()
      .label("Zero-network unavailable Judge");
  },
});
