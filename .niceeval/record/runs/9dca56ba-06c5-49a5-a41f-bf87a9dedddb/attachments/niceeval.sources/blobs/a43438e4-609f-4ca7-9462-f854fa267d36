import { defineEval } from "niceeval";

export default defineEval({
  description: "A deliberate execution exception yielding errored",
  tags: ["state", "errored"],
  async test(t) {
    await t.send("preview/state/errored");
    throw new Error("DELIBERATE_EXPECTED_ERROR_MARKER: preview errored state");
  },
});
