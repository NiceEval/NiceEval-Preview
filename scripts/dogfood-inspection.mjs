import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { withSealedPreviewRecord } from "./preview-record-fixture.mjs";

const queryProtocol = "niceeval.query/v1";
const lifecycleProtocol = "niceeval.view-lifecycle/v1";
const operations = Object.freeze([
  "runs.list",
  "run.get",
  "run.summary",
  "attempt.get",
  "attempt.trace",
  "attempt.diff",
  "attempt.sources",
  "attempt.artifacts",
  "runs.compare",
]);

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const niceeval = join(repositoryRoot, "node_modules", ".bin", process.platform === "win32" ? "niceeval.cmd" : "niceeval");
const resultFields = Object.freeze({
  "runs.list": "runs",
  "run.get": "run",
  "run.summary": "summary",
  "attempt.get": "attempt",
  "attempt.trace": "trace",
  "attempt.diff": "diff",
  "attempt.sources": "sources",
  "attempt.artifacts": "artifacts",
  "runs.compare": "comparison",
});

await withSealedPreviewRecord(repositoryRoot, async ({ leftRunId, rightRunId, locator, project, runNiceEval, snapshot }) => {
  const requestPath = join(snapshot, "..", "request.json");

  const discovery = canonicalJson(runNiceEval(["query", "discover", "--record", snapshot]).stdout, "query discover");
  if (discovery.protocol !== queryProtocol) throw new Error("query discover did not return niceeval.query/v1");
  const discovered = new Set(
    Array.isArray(discovery.operations)
      ? discovery.operations.map((entry) => entry?.id).filter((id) => typeof id === "string")
      : [],
  );
  if (
    !Array.isArray(discovery.operations) || discovery.operations.length !== operations.length ||
    discovered.size !== operations.length || operations.some((operation) => !discovered.has(operation))
  ) {
    throw new Error("query discover did not return the exact fixed operation catalog");
  }

  const requests = [
    { kind: "runs.list" },
    { kind: "run.get", runId: leftRunId },
    { kind: "run.summary", runId: leftRunId },
    { kind: "attempt.get", locator },
    { kind: "attempt.trace", locator },
    { kind: "attempt.diff", locator },
    { kind: "attempt.sources", locator },
    { kind: "attempt.artifacts", locator },
    { kind: "runs.compare", mode: "side-by-side", leftRunIds: [leftRunId], rightRunIds: [rightRunId] },
  ];
  for (const operation of requests) {
    await writeFile(requestPath, `${JSON.stringify({ protocol: queryProtocol, operation })}\n`, "utf8");
    const document = canonicalJson(runNiceEval([
      "query", "run", "--record", snapshot, "--request", requestPath,
    ]).stdout, `query ${operation.kind}`);
    const resultField = resultFields[operation.kind];
    if (
      document.protocol !== queryProtocol ||
      document.operation !== operation.kind ||
      typeof document.behaviorVersion !== "string" ||
      document.behaviorVersion.length === 0 ||
      !Array.isArray(document.issues) ||
      document.outcome === "failure" ||
      document.sealedCutoff === null || typeof document.sealedCutoff !== "object" ||
      document.selection === null || typeof document.selection !== "object" ||
      document.evidence === null || typeof document.evidence !== "object" ||
      !Object.hasOwn(document, resultField)
    ) {
      throw new Error(`query ${operation.kind} did not return a successful fixed-operation document`);
    }
    // Direct Agents intentionally have no Sandbox diff or custom artifacts.
    // Those operations must surface a closed domain state, never an invented value.
    if (operation.kind === "attempt.diff" && document.diff?.state !== "not-recorded") {
      throw new Error("query attempt.diff did not expose its exact not-recorded state");
    }
    if (operation.kind === "attempt.artifacts" && document.artifacts?.state !== "not-recorded") {
      throw new Error("query attempt.artifacts did not expose its exact not-recorded state");
    }
  }

  await verifyView(snapshot, project);
  process.stdout.write("fixed View and Inspection dogfood passed\n");
});

function canonicalJson(stdout, label) {
  const document = json(stdout);
  if (stdout !== `${JSON.stringify(canonicalize(document))}\n`) {
    throw new Error(`${label} did not write one canonical JSON document`);
  }
  return document;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function json(stdout) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`expected one JSON document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function verifyView(record, project) {
  const child = spawn(niceeval, [
    "view", "--record", record, "--no-open", "--port", "0", "--json",
  ], { cwd: project, stdio: ["ignore", "pipe", "pipe"], env: process.env });
  let stderr = "";
  const lifecycle = lifecycleCollector();
  const exited = onceExit(child);
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { lifecycle.push(chunk); });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  try {
    const ready = await waitForReady(lifecycle);
    const url = new URL(ready.url);
    if (url.protocol !== "http:" || !["127.0.0.1", "[::1]", "localhost"].includes(url.hostname) || url.hash.length <= 1) {
      throw new Error("view ready event did not contain a protected loopback URL");
    }
    const bootstrap = await fetch(url);
    if (!bootstrap.ok) throw new Error(`view bootstrap returned ${bootstrap.status}`);
    const session = await fetch(new URL("/_niceeval/session", url), {
      method: "POST",
      headers: { "content-type": "application/json", origin: url.origin },
      body: JSON.stringify({ credential: url.hash.slice(1) }),
    });
    const cookie = session.headers.get("set-cookie");
    if (session.status !== 204 || cookie === null) throw new Error("view did not exchange its one-time credential");
    const shell = await fetch(new URL("/", url), { headers: { cookie, origin: url.origin } });
    const html = await shell.text();
    if (shell.status !== 200 || !html.includes("<title>NiceEval View</title>") || !html.includes("Overview")) {
      throw new Error("view did not serve the fixed Overview shell");
    }
  } finally {
    if (child.exitCode === null && !child.kill("SIGTERM")) throw new Error("view process did not accept SIGTERM");
    const exit = await boundedExit(child, exited, 10_000);
    lifecycle.finish();
    const readyEvents = lifecycle.events.filter((event) => event.event === "ready");
    const terminalEvents = lifecycle.events.filter((event) => event.event === "closed" || event.event === "failed");
    if (
      exit.code !== 0 || readyEvents.length !== 1 || terminalEvents.length !== 1 ||
      terminalEvents[0]?.event !== "closed" || lifecycle.events.at(-1)?.event !== "closed"
    ) {
      throw new Error(`view did not shut down with one terminal closed event (code=${String(exit.code)}, stderrBytes=${Buffer.byteLength(stderr)})`);
    }
  }
}

async function waitForReady(lifecycle) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (lifecycle.failure !== undefined) throw lifecycle.failure;
    const ready = lifecycle.events.find((event) => event.event === "ready" && typeof event.url === "string");
    if (ready !== undefined) return ready;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("niceeval view did not emit a ready lifecycle event");
}

function lifecycleCollector() {
  let pending = "";
  let failure;
  const events = [];
  const parseLine = (line) => {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      failure = new Error("view stdout contained an invalid lifecycle JSON line");
      return;
    }
    if (event.protocol !== lifecycleProtocol || typeof event.event !== "string") {
      failure = new Error("view stdout contained a non-lifecycle event");
      return;
    }
    events.push(event);
  };
  return Object.freeze({
    events,
    get failure() { return failure; },
    push(chunk) {
      if (failure !== undefined) return;
      pending += chunk;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) if (line.length > 0) parseLine(line);
    },
    finish() {
      if (failure !== undefined) throw failure;
      if (pending.length > 0) throw new Error("view stdout ended with an incomplete lifecycle line");
    },
  });
}

function onceExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

async function boundedExit(child, exited, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      exited,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("view did not exit within the shutdown deadline")), timeoutMs);
      }),
    ]);
  } catch (error) {
    if (child.exitCode === null) child.kill("SIGKILL");
    await exited.catch(() => undefined);
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
