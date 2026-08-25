import { defineEval } from "niceeval";

export default defineEval({
  description: "Judge capability without model configuration: zero-network unavailable path",
  tags: ["judge", "state", "unavailable"],
  judge: true,
  async test(t) {
    const turn = await t.send("preview/state/judge-unavailable");
    turn.succeeded().label("Direct Agent completed before Judge evaluation");
    turn.judge.autoevals.closedQA("Does the reply name judge-unavailable?")
      .gate(1)
      .label("Zero-network unavailable Judge");
  },
});
