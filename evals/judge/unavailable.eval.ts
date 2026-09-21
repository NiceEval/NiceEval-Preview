import { defineEval, defineJudge } from "niceeval";

const judging = defineJudge({
  name: "preview-judge-unavailable",
  rubric: "Does the reply name judge-unavailable?",
});

export default defineEval({
  description: "Judge capability without model configuration: zero-network unavailable path",
  tags: ["judge", "state", "unavailable"],
  async test(t) {
    const turn = await t.send("preview/state/judge-unavailable");
    turn.succeeded().label("Direct Agent completed before Judge evaluation");
    const material = { input: turn.input, reply: turn.message };
    turn.check(material, judging)
      .gate(1)
      .label("Zero-network unavailable Judge");
  },
});
