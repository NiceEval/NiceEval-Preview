import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";

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
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.toLowerCase();
  for (const fragment of expectedFragments) {
    if (!output.includes(fragment.toLowerCase())) {
      throw new Error(
        `pnpm ${args.join(" ")} did not expose expected fragment ${JSON.stringify(fragment)}`,
      );
    }
  }
}

// Record identity and its machine-local Coordination state are one generation
// epoch. Removing both avoids binding a fresh Record to a stale local epoch.
await rm(new URL("../.niceeval", import.meta.url), {
  recursive: true,
  force: true,
});

run(["exec", "niceeval", "exp", "pass-gallery/baseline"]);
run(["exec", "niceeval", "exp", "pass-gallery/candidate"]);
run(["exec", "niceeval", "exp", "score-gallery/baseline"]);
run(["exec", "niceeval", "exp", "score-gallery/candidate"]);
run(["exec", "niceeval", "exp", "pass-states"], 1, ["failed", "errored", "skipped"]);
run(["exec", "niceeval", "exp", "score-states"], 0, ["skipped"]);
run(["exec", "niceeval", "exp", "judge-unavailable"], 1, ["unavailable", "errored"]);
run(["exec", "niceeval", "exp", "sandbox-group"]);
run(["exec", "niceeval", "exp", "sandbox-reuse"]);

// The second identical invocation must publish reference Members with carried
// provenance, not silently skip creating a Run.
run(["exec", "niceeval", "exp", "pass-gallery/baseline"]);

process.stdout.write("\nrecord generation complete, including separate Pass/Score comparisons and a second carried/reused baseline Run\n");
