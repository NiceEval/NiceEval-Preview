import { completeEvidenceCoverage, defineSandboxAgent } from "niceeval/adapter";
import { shell } from "niceeval/sandbox";

export const deterministicSandboxAgent = defineSandboxAgent({
  name: "preview-deterministic-sandbox",
  evidenceCoverage: completeEvidenceCoverage,
  ensure: {
    identity: {
      agent: "preview-deterministic-sandbox",
      version: "1",
      revision: "1",
    },
    probe: shell("node --version >/dev/null"),
  },
  async send(input, ctx) {
    if (ctx.signal.aborted) throw new Error("deterministic Sandbox Agent aborted");

    if (input.text === "sandbox/group-alpha") {
      await ctx.sandbox.writeText("workspace/modified.txt", "after-agent-change\n");
      await ctx.sandbox.writeText("workspace/created.txt", "created-by-agent\n");
      const remove = await ctx.sandbox.runCommand("rm", ["workspace/delete-me.txt"]);
      if (remove.exitCode !== 0) throw new Error(`group alpha delete failed: ${remove.stderr}`);
    } else if (input.text === "sandbox/group-beta") {
      await ctx.sandbox.writeText("workspace/beta.txt", "group-beta-agent-change\n");
    } else if (input.text === "sandbox/reuse") {
      await ctx.sandbox.writeText("reuse/result.txt", "reuse-attempt-agent-change\n");
    } else {
      throw new Error(`unknown deterministic Sandbox input: ${JSON.stringify(input.text)}`);
    }

    const operationId = `workspace-edit:${input.text}`;
    return {
      status: "completed",
      data: { fixture: input.text, ok: true },
      usage: { inputTokens: 5, outputTokens: 3, requests: 1, costUSD: 0 },
      events: [
        {
          type: "operation.started",
          operationId,
          operation: {
            kind: "tool",
            name: "workspace_edit",
            input: { task: input.text },
          },
        },
        {
          type: "operation.finished",
          operationId,
          kind: "tool",
          output: { changed: true },
          status: "completed",
        },
        {
          type: "message",
          role: "assistant",
          text: `SANDBOX_OK ${input.text}`,
        },
      ],
    };
  },
});
