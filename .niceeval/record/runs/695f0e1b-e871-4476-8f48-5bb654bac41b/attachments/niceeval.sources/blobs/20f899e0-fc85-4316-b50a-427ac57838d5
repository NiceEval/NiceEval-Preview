import { defineEval } from "niceeval";
import { includes } from "niceeval/expect";

export default defineEval({
  description: "A deliberate Assertion mismatch yielding failed",
  tags: ["state", "failed"],
  async test(t) {
    const turn = await t.send("preview/state/failed");
    turn.succeeded().label("Execution itself completed");
    t.check(turn.message, includes("DELIBERATE_EXPECTED_FAILURE_MARKER"))
      .label("Deliberate report failure");
  },
});
