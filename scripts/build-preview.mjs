import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const manifest = JSON.parse(
  await readFile(new URL("../preview-runs.json", import.meta.url), "utf8"),
);

if (
  manifest?.format !== "niceeval.preview-runs/v1" ||
  !Array.isArray(manifest.runIds) ||
  manifest.runIds.length === 0 ||
  manifest.runIds.some((runId) =>
    typeof runId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(runId)
  )
) {
  throw new Error("preview-runs.json must contain a non-empty niceeval.preview-runs/v1 Run list");
}

const forwardedArgs = process.argv.slice(2);
const outputArgs = (forwardedArgs[0] === "--" ? forwardedArgs.slice(1) : forwardedArgs);
if (outputArgs.length === 0) outputArgs.push("--out", ".preview");
const runArgs = manifest.runIds.flatMap((runId) => ["--run", runId]);
const result = spawnSync(pnpm, ["exec", "niceeval", "view", ...runArgs, ...outputArgs], {
  stdio: "inherit",
  env: process.env,
});

if (result.error !== undefined) throw result.error;
if (result.status !== 0) {
  throw new Error(`niceeval view exited ${String(result.status)}`);
}
