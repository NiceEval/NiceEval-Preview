import { defineEval } from "niceeval";
import { equals, toolMatch } from "niceeval/expect";

export default defineEval({
  description: "A real waiting input request resumed through the public HITL assertion API",
  tags: ["gallery", "direct", "hitl"],
  metadata: { preview: true, population: "gallery" },
  async test(t) {
    const waiting = await t.send("preview/hitl");
    t.check(waiting.status, equals("waiting")).label("HITL turn waits");
    waiting.calledTool(toolMatch("deploy_preview", { status: "pending" }), { count: 1 })
      .label("Pending tool is visible before approval");
    const request = t.requireInputRequest({
      id: "preview-deploy-approval",
      prompt: /Approve deterministic preview deploy/u,
      display: /Preview deploy approval/u,
      action: "deploy_preview",
      input: { environment: "preview" },
      optionIds: ["approve", "reject"],
    });
    const resumed = await t.respond({ request, optionId: "approve" });
    resumed.succeeded().label("HITL response resumes the session");
    t.calledTool(toolMatch("deploy_preview", { status: "completed" }), { count: 1 })
      .label("Approved tool completes");
    t.maxTokens(200).label("HITL usage spans waiting and resumed turns");
    t.maxCost(0.01).label("HITL observed cost remains offline-sized");
  },
});
