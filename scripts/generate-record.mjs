import { spawnSync } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(args, expectedStatus = 0, expectedFragments = []) {
  process.stdout.write(`\n> pnpm ${args.join(" ")}\n`);
  const result = spawnSync(pnpm, args, {
    encoding: "utf8",
    env: process.env,
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.error !== undefined) throw result.error;
  if (result.status !== expectedStatus) {
    throw new Error(
      `pnpm ${args.join(" ")} exited ${String(result.status)}; expected ${expectedStatus}`,
    );
  }
  const rawOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const output = rawOutput.toLowerCase();
  for (const fragment of expectedFragments) {
    if (!output.includes(fragment.toLowerCase())) {
      throw new Error(
        `pnpm ${args.join(" ")} did not expose expected fragment ${JSON.stringify(fragment)}`,
      );
    }
  }
  const runIds = [...rawOutput.matchAll(/details: niceeval show --run ([0-9a-f-]{36})/gu)]
    .map((match) => match[1]);
  if (runIds.length !== 1) {
    throw new Error(`pnpm ${args.join(" ")} did not expose exactly one completed Run id`);
  }
  return runIds[0];
}

// Record identity and its machine-local Coordination state are one generation
// epoch. Removing both avoids binding a fresh Record to a stale local epoch.
await rm(new URL("../.niceeval", import.meta.url), {
  recursive: true,
  force: true,
});

const runIds = [];
// The first baseline Run remains in the Record as reuse provenance. The static
// selection uses only the later carried Run so historical membership rows keep
// one identity per Attempt.
run(["exec", "niceeval", "exp", "pass-gallery/baseline"]);
runIds.push(run(["exec", "niceeval", "exp", "pass-gallery/candidate"]));
runIds.push(run(["exec", "niceeval", "exp", "score-gallery/baseline"]));
runIds.push(run(["exec", "niceeval", "exp", "score-gallery/candidate"]));
runIds.push(run(["exec", "niceeval", "exp", "pass-states"], 1, ["failed", "errored", "skipped"]));
runIds.push(run(["exec", "niceeval", "exp", "score-states"], 0, ["skipped"]));
runIds.push(run(["exec", "niceeval", "exp", "judge-unavailable"], 1, ["unavailable", "errored"]));
runIds.push(run(["exec", "niceeval", "exp", "sandbox-group"]));
runIds.push(run(["exec", "niceeval", "exp", "sandbox-reuse"]));

// The second identical invocation must publish reference Members with carried
// provenance, not silently skip creating a Run.
runIds.push(run(["exec", "niceeval", "exp", "pass-gallery/baseline"]));

await writeFile(
  new URL("../preview-runs.json", import.meta.url),
  `${JSON.stringify({ format: "niceeval.preview-runs/v1", runIds }, null, 2)}\n`,
  "utf8",
);

process.stdout.write("\nrecord generation complete, including separate Pass/Score comparisons and a second carried/reused baseline Run\n");
