import { defineScoreEval } from "niceeval";
import { defineScoreMatch } from "niceeval/expect";

export default defineScoreEval({
  description: "A deterministic 40% quality Score with observed divergent-tier usage",
  tags: ["gallery", "score", "divergent-tier"],
  async test(t) {
    const turn = await t.send("preview/state/score-divergent");
    await turn.succeeded().orStop();

    const quality = defineScoreMatch<string>({
      name: "divergent-tier deterministic quality",
      score: () => 0.4,
    });
    t.check(turn.message, quality.atLeast(0))
      .score(20)
      .label("Divergent tier earns 40% of its available Score");
  },
});
