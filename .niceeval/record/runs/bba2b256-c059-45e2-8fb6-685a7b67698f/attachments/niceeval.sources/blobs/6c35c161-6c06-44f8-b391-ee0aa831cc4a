import { defineEval } from "niceeval";
import { commandSucceeded, includes, isFalse } from "niceeval/expect";

export default defineEval({
  description: "Independent sandboxReuse lane reset between attempts",
  tags: ["sandbox", "reuse"],
  diff: { include: ["reuse/**"] },
  async test(t) {
    t.check(await t.sandbox.pathExists("reuse/result.txt"), isFalse())
      .label("Reset removed the previous Attempt result");
    await t.sandbox.runCommandOrThrow("mkdir", ["-p", "reuse"]);
    await t.sandbox.writeText("reuse/seed.txt", "prepared-outside-send\n");

    const turn = await t.send("sandbox/reuse");
    turn.succeeded().label("Reusable Sandbox Agent completed");
    const probe = await t.sandbox.runShell("test -f reuse/result.txt && test -f reuse/seed.txt");
    t.check(probe, commandSucceeded()).label("Reuse lane files exist");
    t.check(await t.sandbox.readText("reuse/result.txt"), includes("reuse-attempt-agent-change"));
    t.sandbox.changedPaths(["reuse/result.txt"]).label("Only send-window mutation is attributed");
    t.sandbox.fileChanged("reuse/result.txt", {
      status: "added",
      after: includes("reuse-attempt-agent-change"),
    }).label("Reuse result was added by Agent");
    t.sandbox.notInDiff(/prepared-outside-send/u)
      .label("Eval preparation is excluded from Agent diff");
  },
});
