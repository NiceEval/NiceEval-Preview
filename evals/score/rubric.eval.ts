import { defineScoreEval } from "niceeval";
import { defineScoreMatch, equals, includes } from "niceeval/expect";

const complete = defineScoreEval({
  description: "Complete Score with matched, mismatched, measurement, and direct contributions",
  tags: ["gallery", "score", "complete"],
  async test(t) {
    const turn = await t.send("preview/state/score-complete");
    turn.succeeded().score(2).key("turn-complete").label("Completed turn");
    await t.group("Complete rubric", () => {
      t.check(turn.message, includes("score-complete"))
        .score(3)
        .key("reply-marker")
        .label("Matched Boolean contribution");
      t.check(turn.message, includes("never-present"))
        .score(5)
        .key("zero-contribution")
        .label("Mismatched Boolean contributes zero");
      t.check(turn.message, defineScoreMatch({
        name: "rubric measurement",
        score: (value: string) => (value.includes("score-complete") ? 0.75 : 0),
      }).atLeast(0.5)).score(4).label("Measurement contributes three points");
      t.score(1).key("direct-score").label("Direct score contribution");
    });
  },
});

const zero = defineScoreEval({
  description: "A normal complete zero score",
  tags: ["gallery", "score", "zero"],
  test(t) {
    t.check("actual", equals("expected"))
      .score(4)
      .label("Mismatched contribution yields complete zero");
  },
});

const stopped = defineScoreEval({
  description: "orStop keeps earned points and omits unreachable contributions",
  tags: ["gallery", "score", "or-stop"],
  async test(t) {
    t.score(2).label("Earned before orStop");
    await t.check("actual", equals("expected"))
      .score(3)
      .label("Stopping mismatch")
      .orStop();
    t.score(100).label("Unreachable direct score");
  },
});

const skipped = defineScoreEval({
  description: "A skipped Score Attempt retained outside ranking",
  tags: ["state", "score", "skipped"],
  test(t) {
    t.score(9).label("Score retained before skip");
    t.skip("DELIBERATE_EXPECTED_SCORE_SKIP_MARKER");
  },
});

export default { complete, skipped, stopped, zero };
