import {
  commandProjection,
  completeEvidenceCoverage,
  createSessionSlot,
  defineAgent,
  notCommandProjection,
} from "niceeval/adapter";
import type { StreamEvent, Turn, Usage } from "niceeval";

type PendingApproval = {
  readonly requestId: string;
  readonly operationId: string;
};

const pendingApproval = createSessionSlot<PendingApproval>(
  "niceeval-preview/pending-approval",
);
const turnNumber = createSessionSlot<number>("niceeval-preview/turn-number");

function usage(multiplier = 1): Usage {
  return {
    inputTokens: 40 * multiplier,
    outputTokens: 12 * multiplier,
    cacheReadTokens: 8 * multiplier,
    cacheCreationTokens: 4 * multiplier,
    reasoningTokens: 3 * multiplier,
    requests: 1,
    costUSD: 0.000_04 * multiplier,
  };
}

function completedMessage(text: string): StreamEvent {
  return { type: "message", role: "assistant", text };
}

/**
 * A completely offline Direct Agent. It emits every standard conversation
 * category that the built-in Report can retain, plus raw thinking and
 * compaction events whose presence is recorded by Assertions.
 */
export const deterministicAgent = defineAgent({
  name: "preview-deterministic-direct",
  evidenceCoverage: completeEvidenceCoverage,
  async send(input, ctx): Promise<Turn> {
    if (ctx.signal.aborted) throw new Error("deterministic preview send aborted");

    const ordinal = (ctx.session.get(turnNumber) ?? 0) + 1;
    ctx.session.set(turnNumber, ordinal);

    const held = ctx.session.take(pendingApproval);
    if (held !== undefined) {
      const resumedOperationId = `${held.operationId}-resumed`;
      const response = input.responses?.find(
        (candidate) => candidate.requestId === held.requestId,
      );
      if (response === undefined || response.optionId !== "approve") {
        throw new Error("preview HITL fixture expected an approve response");
      }

      return {
        status: "completed",
        data: { approved: true, requestId: held.requestId, ordinal },
        usage: usage(),
        events: [
          {
            type: "operation.started",
            operationId: resumedOperationId,
            operation: {
              kind: "tool",
              name: "deploy_preview",
              input: { environment: "preview", revision: "deterministic" },
              command: notCommandProjection(),
            },
          },
          {
            type: "operation.finished",
            operationId: resumedOperationId,
            kind: "tool",
            output: { deployed: true, environment: "preview" },
            status: "completed",
          },
          { type: "context.injected", text: "Human approved preview deploy", source: "user" },
          completedMessage("Approval received; deterministic preview deploy completed."),
        ],
      };
    }

    if (input.text === "preview/hitl") {
      const requestId = "preview-deploy-approval";
      const operationId = "preview-deploy-operation";
      ctx.session.set(pendingApproval, { requestId, operationId });
      return {
        status: "waiting",
        data: { waitingFor: requestId, ordinal },
        usage: usage(),
        events: [
          { type: "thinking", text: "A human must approve the deterministic deploy." },
          {
            type: "operation.started",
            operationId,
            operation: {
              kind: "tool",
              name: "deploy_preview",
              input: { environment: "preview", revision: "deterministic" },
              command: notCommandProjection(),
            },
          },
          {
            type: "input.requested",
            request: {
              id: requestId,
              prompt: "Approve deterministic preview deploy?",
              display: "Preview deploy approval",
              action: "deploy_preview",
              input: { environment: "preview" },
              options: [
                { id: "approve", label: "Approve" },
                { id: "reject", label: "Reject" },
              ],
            },
          },
          { type: "compaction", reason: "waiting-for-human" },
        ],
      };
    }

    if (input.text === "preview/file") {
      const file = input.files?.[0];
      return {
        status: "completed",
        data: {
          fileCount: input.files?.length ?? 0,
          filename: file?.filename ?? null,
          mimeType: file?.mimeType ?? null,
          ordinal,
        },
        usage: usage(),
        events: [
          { type: "thinking", text: "Inspecting the attached deterministic brief." },
          completedMessage("Attachment received: brief.txt"),
        ],
      };
    }

    if (input.text === "preview/session-first" || input.text === "preview/session-second") {
      const marker = input.text.endsWith("first") ? "first" : "second";
      const operationId = `session-${marker}-${ordinal}`;
      return {
        status: "completed",
        data: { marker, ordinal },
        usage: usage(),
        events: [
          {
            type: "operation.started",
            operationId,
            operation: {
              kind: "tool",
              name: "session_note",
              input: { marker, ordinal },
              command: notCommandProjection(),
            },
          },
          {
            type: "operation.finished",
            operationId,
            kind: "tool",
            output: { recorded: true, marker },
            status: "completed",
          },
          completedMessage(`Session ${marker} reply at turn ${ordinal}.`),
        ],
      };
    }

    if (input.text === "preview/events") {
      ctx.progress({ message: "emitting deterministic event gallery", current: 1, total: 1 });
      ctx.diagnostic({
        code: "preview-diagnostic",
        level: "warning",
        message: "Intentional durable diagnostic for the report gallery",
        data: { source: "deterministic-agent", network: false },
      });

      return {
        status: "completed",
        data: {
          fixture: "event-gallery",
          ok: true,
          model: ctx.model ?? null,
          flags: ctx.flags,
          ordinal,
        },
        usage: usage(2),
        events: [
          { type: "message", role: "user", text: "Internal deterministic context message." },
          { type: "thinking", text: "Plan the offline preview response." },
          {
            type: "context.injected",
            text: "Preview policy: never contact a provider.",
            source: "system",
          },
          { type: "skill.loaded", skill: "preview-reporting", operationId: "skill-preview" },
          { type: "error", message: "Intentional recoverable preview stream error." },
          {
            type: "operation.started",
            operationId: "subagent-preview",
            operation: { kind: "subagent", name: "offline-researcher" },
          },
          {
            type: "operation.finished",
            operationId: "subagent-preview",
            kind: "subagent",
            output: { summary: "No network required." },
            status: "completed",
          },
          {
            type: "operation.started",
            operationId: "tool-preview",
            operation: {
              kind: "tool",
              name: "lookup_fixture",
              input: { key: "preview", path: "fixtures/brief.txt" },
              command: notCommandProjection(),
            },
          },
          {
            type: "operation.finished",
            operationId: "tool-preview",
            kind: "tool",
            output: { found: true, value: "deterministic" },
            status: "completed",
          },
          {
            type: "operation.started",
            operationId: "command-preview",
            operation: {
              kind: "tool",
              name: "shell",
              input: { command: "node --version" },
              command: commandProjection({
                state: "available",
                executable: "node",
                args: ["--version"],
              }),
            },
          },
          {
            type: "operation.finished",
            operationId: "command-preview",
            kind: "tool",
            output: { stdout: "v24.0.0", exitCode: 0 },
            status: "completed",
          },
          { type: "compaction", reason: "deterministic-context-budget" },
          completedMessage(
            "PREVIEW_OK: message, tools, command, subagent, skill, context, compaction, usage, and cost are recorded.",
          ),
        ],
      };
    }

    if (input.text.startsWith("preview/state/")) {
      return {
        status: "completed",
        data: { fixture: input.text, ordinal },
        usage: usage(),
        events: [completedMessage(`Completed ${input.text}.`)],
      };
    }

    throw new Error(`unknown deterministic preview input: ${JSON.stringify(input.text)}`);
  },
});
