import { defineScoreEval } from "niceeval";
import { commandSucceeded, includes, toolMatch } from "niceeval/expect";

export default defineScoreEval({
  description: "Eval Group member B: Score contribution on the same physical lane",
  tags: ["sandbox", "group", "score"],
  diff: { include: ["workspace/**"] },
  async test(t) {
    await t.sandbox.runShellOrThrow("mkdir -p workspace");
    const turn = await t.send("sandbox/group-beta");
    turn.succeeded().score(1).label("Group B Agent completed");
    turn.calledTool(toolMatch("workspace_edit", { status: "completed" }))
      .score(1)
      .label("Workspace edit tool");
    const probe = await t.sandbox.runCommand("test", ["-f", "workspace/beta.txt"]);
    t.check(probe, commandSucceeded()).score(1).label("Group B file exists");
    t.check(await t.sandbox.readText("workspace/beta.txt"), includes("group-beta-agent-change"))
      .score(2)
      .label("Group B content");
    t.sandbox.changedPaths(["workspace/beta.txt"])
      .score(1)
      .label("Group B exact diff");
    t.sandbox.fileChanged("workspace/beta.txt", {
      status: "added",
      after: includes("group-beta-agent-change"),
    }).score(1).label("Group B added file");
    t.sandbox.notInDiff(/forbidden-preview-token/u)
      .score(1)
      .label("Group B safe diff");
  },
});
