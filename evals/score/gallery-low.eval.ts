import { defineScoreEval } from "niceeval";
import { includes } from "niceeval/expect";

export default defineScoreEval({
  description: "A deterministic zero-quality Score with observed low-tier usage",
  tags: ["gallery", "score", "low-tier"],
  async test(t) {
    const turn = await t.send("preview/state/score-low");
    await turn.succeeded().orStop();
    t.check(turn.message, includes("never-present"))
      .score(10)
      .label("Low tier earns zero of its available Score");
  },
});
