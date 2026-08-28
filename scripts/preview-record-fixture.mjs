import { spawnSync } from "node:child_process";
import { cp, copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function withSealedPreviewRecord(repositoryRoot, useRecord) {
  let project;
  let workspace;
  try {
    project = await mkdtemp(join(repositoryRoot, ".niceeval-preview-dogfood-"));
    workspace = await mkdtemp(join(tmpdir(), "niceeval-preview-inspection-"));
    const snapshot = join(workspace, "preview.record-snapshot.sqlite");
    await prepareProject(repositoryRoot, project);
    const runNiceEval = (args) => runNiceEvalCommand(repositoryRoot, project, args);
    const left = runNiceEval(["exp", "inspection/left", "--rerun", "all", "--json"]);
    const right = runNiceEval(["exp", "inspection/right", "--rerun", "all", "--json"]);

    await runNiceEval(["record", "snapshot", "--output", snapshot]);
    return await useRecord({
      leftRunId: exactly(runIds(left.stdout), "left Run id"),
      rightRunId: exactly(runIds(right.stdout), "right Run id"),
      locator: exactly(attemptLocators(left.stdout), "left Attempt locator"),
      project,
      runNiceEval,
      snapshot,
    });
  } finally {
    const cleanup = await Promise.allSettled([
      ...(workspace === undefined ? [] : [rm(workspace, { recursive: true, force: true })]),
      ...(project === undefined ? [] : [rm(project, { recursive: true, force: true })]),
    ]);
    const failed = cleanup.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      throw new AggregateError(failed.map((result) => result.reason), "dogfood fixture cleanup failed");
    }
  }
}

function runNiceEvalCommand(repositoryRoot, project, args) {
  const executable = join(
    repositoryRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "niceeval.cmd" : "niceeval",
  );
  const result = spawnSync(executable, args, { cwd: project, encoding: "utf8", env: process.env });
  if (result.error !== undefined) throw result.error;
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`niceeval ${args[0] ?? "command"} exited ${String(result.status)}`);
  }
  return result;
}

async function prepareProject(repositoryRoot, target) {
  await Promise.all([
    mkdir(join(target, "agents"), { recursive: true }),
    mkdir(join(target, "evals", "states"), { recursive: true }),
  ]);
  await Promise.all([
    copyFile(join(repositoryRoot, "agents", "deterministic.ts"), join(target, "agents", "deterministic.ts")),
    copyFile(join(repositoryRoot, "evals", "states", "pass.eval.ts"), join(target, "evals", "states", "pass.eval.ts")),
    copyFile(join(repositoryRoot, "niceeval.config.ts"), join(target, "niceeval.config.ts")),
    cp(join(repositoryRoot, "experiments", "inspection"), join(target, "experiments", "inspection"), { recursive: true }),
  ]);
}

function runIds(stdout) {
  return [...new Set([
    ...collectJsonValues(stdout, "runId"),
    ...collectJsonValues(stdout, "runIds"),
    ...collectJsonValues(stdout, "createdRunIds"),
  ])].filter((value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(value));
}

function attemptLocators(stdout) {
  return collectJsonValues(stdout, "locator").filter((value) => value.startsWith("@"));
}

function collectJsonValues(stdout, key) {
  const values = new Set();
  for (const line of stdout.split("\n")) {
    if (line.length === 0) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    visit(parsed, key, values);
  }
  return [...values];
}

function visit(value, key, values) {
  if (Array.isArray(value)) {
    value.forEach((entry) => visit(entry, key, values));
  } else if (value !== null && typeof value === "object") {
    for (const [entryKey, entryValue] of Object.entries(value)) {
      if (entryKey === key && typeof entryValue === "string") values.add(entryValue);
      if (entryKey === key && Array.isArray(entryValue)) {
        for (const item of entryValue) if (typeof item === "string") values.add(item);
      }
      visit(entryValue, key, values);
    }
  }
}

function exactly(values, label) {
  if (values.length !== 1) throw new Error(`expected exactly one ${label}, received ${JSON.stringify(values)}`);
  return values[0];
}
