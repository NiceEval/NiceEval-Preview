import { defineEval } from "niceeval";
import {
  commandSucceeded,
  equals,
  includes,
  isFalse,
  isTrue,
  toolMatch,
} from "niceeval/expect";

export default defineEval({
  description: "Eval Group member A: command, file IO, and full diff assertions",
  tags: ["sandbox", "group", "diff"],
  diff: { include: ["workspace/**"] },
  async test(t) {
    await t.sandbox.writeText("workspace/modified.txt", "before-agent-change\n");
    await t.sandbox.writeText("workspace/delete-me.txt", "delete-me\n");
    await t.sandbox.writeBytes("workspace/seed.bin", new Uint8Array([78, 69]));
    t.check(await t.sandbox.pathExists("workspace/delete-me.txt"), isTrue())
      .label("Seeded file exists before send");
    t.check(await t.sandbox.pathExists("workspace/created.txt"), isFalse())
      .label("Created file is absent before send");

    const nodeVersion = await t.sandbox.runCommand("node", ["--version"]);
    t.check(nodeVersion, commandSucceeded()).label("runCommand executes Node");

    const turn = await t.send("sandbox/group-alpha");
    turn.succeeded().label("Sandbox Group A Agent completed");
    turn.calledTool(toolMatch("workspace_edit", { status: "completed" }), { count: 1 });

    const shellProbe = await t.sandbox.runShell(
      "test -f workspace/modified.txt && test -f workspace/created.txt && test ! -e workspace/delete-me.txt",
    );
    t.check(shellProbe, commandSucceeded()).label("runShell verifies final files");
    t.check(await t.sandbox.readText("workspace/modified.txt"), includes("after-agent-change"))
      .label("readText observes Agent content");
    t.check((await t.sandbox.readBytes("workspace/seed.bin")).length, equals(2))
      .label("Binary IO remains available");

    t.sandbox.changedPaths([
      "workspace/created.txt",
      "workspace/delete-me.txt",
      "workspace/modified.txt",
    ]).label("Exact Agent-attributed paths");
    t.sandbox.fileChanged("workspace/modified.txt", {
      status: "modified",
      before: includes("before-agent-change"),
      after: includes("after-agent-change"),
    }).label("Modified file endpoint pair");
    t.sandbox.fileChanged("workspace/created.txt", {
      status: "added",
      after: includes("created-by-agent"),
    }).label("Added file endpoint");
    t.sandbox.fileDeleted("workspace/delete-me.txt").label("Deleted file endpoint");
    t.sandbox.notInDiff(/forbidden-preview-token/u, { content: "both" })
      .label("Forbidden token absent from diff");
  },
});
