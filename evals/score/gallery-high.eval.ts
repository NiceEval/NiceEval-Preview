import { defineScoreEval } from "niceeval";
import { defineScoreMatch } from "niceeval/expect";

export default defineScoreEval({
  description: "A deterministic 65% quality Score for the high-cost gallery tier",
  tags: ["gallery", "score", "high-tier"],
  async test(t) {
    const turn = await t.send("preview/state/score-high");
    await turn.succeeded().orStop();

    const quality = defineScoreMatch<string>({
      name: "high-tier deterministic quality",
      score: () => 0.65,
    });

    t.check(turn.message, quality.atLeast(0))
      .score(20)
      .label("High tier earns 65% of its available Score");
  },
});
