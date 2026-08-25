import { defineEval, type JsonValue } from "niceeval";
import {
  commandMatch,
  defineScoreMatch,
  equals,
  eventMatch,
  includes,
  isDefined,
  jsonMatch,
  satisfies,
  toolMatch,
} from "niceeval/expect";

const exactSimilarity = defineScoreMatch<string>({
  name: "preview exact similarity",
  score: (value) => (value.includes("PREVIEW_OK") ? 1 : 0),
});

function requireJson(value: JsonValue | undefined): JsonValue {
  if (value === undefined) throw new Error("deterministic preview expected Turn.data");
  return value;
}

export default defineEval({
  description: "Rich Direct Agent events, files, multiple turns, and multiple sessions",
  tags: ["gallery", "direct", "events", "sessions"],
  metadata: { preview: true, population: "gallery" },
  async test(t) {
    const events = await t.send("preview/events");

    await t.group("Event gallery", async () => {
      await events.succeeded().key("events-completed").label("Event turn completed").orStop();
      events.calledTool(
        toolMatch("lookup_fixture", {
          input: jsonMatch({ path: "fixtures/brief.txt" }),
          output: jsonMatch({ found: true }),
          status: "completed",
        }),
        { count: 1 },
      ).key("ordinary-tool").label("Ordinary tool completed");
      events.calledTool(
        commandMatch("node", { argsStart: ["--version"], status: "completed" }),
        { count: 1 },
      ).key("command-projection").label("Command projection completed");
      events.toolOrder([
        toolMatch("lookup_fixture"),
        commandMatch("node", { argsStart: ["--version"] }),
      ]).label("Tool order is stable");
      events.event(eventMatch("message", { role: "assistant", text: includes("PREVIEW_OK") }), {
        count: 1,
      }).label("Assistant message event");
      events.eventOrder([
        eventMatch("operation.started", { tool: toolMatch("lookup_fixture") }),
        eventMatch("operation.finished", { tool: toolMatch("lookup_fixture") }),
        eventMatch("operation.started", { tool: commandMatch("node") }),
        eventMatch("operation.finished", { tool: commandMatch("node") }),
        eventMatch("message", { role: "assistant", text: includes("PREVIEW_OK") }),
      ]).label("Event order is stable");
      events.maxToolCalls(2).label("Exactly two tool calls fit the cap");
      events.notCalledTool("missing_preview_tool").label("Missing tool is absent");
      events.noFailedActions().label("All emitted actions completed");
      events.notEvent(eventMatch("message", { text: includes("MISSING_EVENT_MARKER") }))
        .label("Missing message event is absent");
      events.maxTokens(200).label("Turn token usage is bounded");
      events.maxCost(0.01).label("Turn observed cost is bounded");
      const eventData: unknown = events.data;
      t.check(eventData, isDefined<unknown>("event gallery data")).label("Structured data exists");
      t.check(events.message, exactSimilarity)
        .atLeast(1)
        .label("Measurement threshold is recorded");
      t.check(events.message, defineScoreMatch({
        name: "preview gate measurement",
        score: (value: string) => (value.includes("PREVIEW_OK") ? 1 : 0),
      })).gate(1).label("Measurement gate passes");
      t.check(events.events, satisfies("skill.loaded exists", (items) =>
        items.some((event) => event.type === "skill.loaded" && event.skill === "preview-reporting"),
      )).label("Skill load is recorded");
      t.check(events.events, satisfies("subagent lifecycle exists", (items) =>
        items.some((event) => event.type === "operation.started" && event.operation.kind === "subagent"),
      )).label("Subagent event is recorded");
      t.check(events.events, satisfies("context and compaction exist", (items) =>
        items.some((event) => event.type === "context.injected") &&
        items.some((event) => event.type === "compaction"),
      )).label("Context injection and compaction are recorded");
      t.check(events.events, satisfies("stream error exists", (items) =>
        items.some((event) => event.type === "error"),
      )).label("Conversation error is recorded");
      t.check("optional actual", includes("optional"))
        .optional()
        .label("Optional assertion is recorded without gating");
      t.check(true, equals(true)).gate().label("Explicit Boolean gate passes");
    });

    const attachment = await t.sendFile("fixtures/brief.txt", "preview/file");
    const attachmentData = requireJson(attachment.data);
    t.check(attachmentData, satisfies("one named attachment", (value) =>
      typeof value === "object" && value !== null && !Array.isArray(value) &&
      value.fileCount === 1 && value.filename === "brief.txt",
    )).label("sendFile attachment reaches the Direct Agent");
    t.check(attachment.message, includes("brief.txt"))
      .label("Attachment response names the supplied file");
    attachment.usedNoTools().label("Attachment turn used no tools");
    attachment.noFailedActions().label("Attachment turn has no failed actions");

    const main = t.newSession();
    const first = await main.send("preview/session-first");
    const second = await main.send("preview/session-second");
    const branch = t.newSession();
    const branchTurn = await branch.send("preview/session-first");

    await t.group("Session and turn scopes", () => {
      first.calledTool("session_note", { count: 1 }).label("First turn tool count");
      second.calledTool("session_note", { count: 1 }).label("Second turn tool count");
      main.calledTool("session_note", { count: 2 }).label("Main session aggregate count");
      main.toolOrder([toolMatch("session_note"), toolMatch("session_note")])
        .label("Main session spans two turns in order");
      main.notCalledTool("missing_session_tool").label("Missing session tool is absent");
      main.noFailedActions().label("Main session has no failed actions");
      branch.calledTool("session_note", { count: 1 }).label("Branch session is isolated");
      t.check(second.message, includes("Session second reply"));
      const branchData = requireJson(branchTurn.data);
      t.check(branchData, jsonMatch({ marker: "first", ordinal: 1 }))
        .label("New session starts its own state");
    });

    t.maxTokens(1_000).label("Attempt token usage is bounded");
    t.maxCost(0.1).label("Attempt observed cost is bounded");
    t.notCalledTool("missing_attempt_tool").label("Missing attempt tool is absent");
    t.noFailedActions().label("Attempt has no failed actions");
    t.notEvent(eventMatch("message", { text: includes("MISSING_ATTEMPT_EVENT") }))
      .label("Missing attempt event is absent");

    t.diagnostic({
      code: "preview-eval-diagnostic",
      level: "warning",
      message: "Intentional Eval diagnostic retained for the preview",
      data: { deterministic: true },
    });
  },
});
