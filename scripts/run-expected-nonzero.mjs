import { spawnSync } from "node:child_process";

const [experiment, ...expectedFragments] = process.argv.slice(2);
if (experiment === undefined || expectedFragments.length === 0) {
  throw new Error("usage: run-expected-nonzero.mjs <experiment> <expected-fragment>...");
}

const result = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "niceeval", "exp", experiment],
  { encoding: "utf8", env: process.env },
);

process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

if (result.error !== undefined) throw result.error;
if (result.status !== 1) {
  throw new Error(
    `expected niceeval exp ${experiment} to exit 1, received ${String(result.status)}`,
  );
}

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.toLowerCase();
for (const fragment of expectedFragments) {
  if (!output.includes(fragment.toLowerCase())) {
    throw new Error(
      `expected niceeval exp ${experiment} output to include ${JSON.stringify(fragment)}`,
    );
  }
}

process.stdout.write(
  `expected-nonzero: ${experiment} exited 1 and exposed ${expectedFragments.join(", ")}\n`,
);
