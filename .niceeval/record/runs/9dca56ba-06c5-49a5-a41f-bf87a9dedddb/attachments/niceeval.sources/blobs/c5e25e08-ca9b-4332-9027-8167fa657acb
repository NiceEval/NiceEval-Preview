import { defineEval } from "niceeval";
import { includes } from "niceeval/expect";

export default defineEval({
  description: "A deterministic passed Verdict",
  tags: ["state", "pass"],
  async test(t) {
    const turn = await t.send("preview/state/pass");
    turn.succeeded().label("Pass turn completed");
    t.check(turn.message, includes("preview/state/pass")).label("Pass marker");
  },
});
