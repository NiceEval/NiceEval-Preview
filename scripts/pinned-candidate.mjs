import { spawn } from "node:child_process";
import { cp, copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const candidateRepository = "https://github.com/NiceEval/NiceEval.git";
const consumerFiles = Object.freeze([
  "niceeval.config.ts",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
]);
const consumerDirectories = Object.freeze([
  "agents",
  "evals",
  "experiments",
  "sandboxes",
]);

export async function withPinnedCandidate(repositoryRoot, useCandidate) {
  if (process.env.NICEEVAL_PREVIEW_USE_INSTALLED_CANDIDATE === "1") {
    await useCandidate({ consumerRoot: repositoryRoot, source: "installed" });
    return;
  }

  const sha = await readCandidateSha(repositoryRoot);
  let temporaryRoot;
  try {
    temporaryRoot = await mkdtemp(join(tmpdir(), "niceeval-preview-candidate-"));
    const candidateRoot = join(temporaryRoot, "niceeval");
    const consumerRoot = join(temporaryRoot, "consumer");

    await run("git", ["clone", "--filter=blob:none", candidateRepository, candidateRoot]);
    await run("git", ["-C", candidateRoot, "fetch", "origin", sha]);
    await run("git", ["-C", candidateRoot, "checkout", "--detach", sha]);
    const actualSha = (await capture("git", ["-C", candidateRoot, "rev-parse", "HEAD"])).trim();
    if (actualSha !== sha) throw new Error(`candidate identity mismatch: expected ${sha}, received ${actualSha}`);

    // `consumer:link` mutates the named consumer's installed dependency graph.
    // Build it against this disposable copy so a Preview build never rewrites a
    // user's manifest, lockfile, workspace declaration, or node_modules.
    await prepareBuildConsumer(repositoryRoot, consumerRoot);
    await run("pnpm", ["install", "--frozen-lockfile"], consumerRoot);
    await run("pnpm", ["install", "--frozen-lockfile"], candidateRoot);
    await run("pnpm", ["consumer:link", "apply", "--json", consumerRoot], candidateRoot);
    await run("pnpm", ["consumer:link", "check", "--json", consumerRoot], candidateRoot);
    await useCandidate({ consumerRoot, sha, source: "pinned" });
  } finally {
    if (temporaryRoot !== undefined) await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function readCandidateSha(repositoryRoot) {
  const value = (await readFile(join(repositoryRoot, "niceeval-candidate.sha"), "utf8")).trim();
  if (!/^[0-9a-f]{40}$/u.test(value)) {
    throw new Error("niceeval-candidate.sha must contain one lowercase 40-character Git SHA");
  }
  return value;
}

async function prepareBuildConsumer(sourceRoot, targetRoot) {
  await mkdir(targetRoot, { recursive: true });
  await Promise.all([
    ...consumerFiles.map((file) => copyFile(join(sourceRoot, file), join(targetRoot, file))),
    ...consumerDirectories.map((directory) => cp(
      join(sourceRoot, directory),
      join(targetRoot, directory),
      { recursive: true },
    )),
  ]);
}

function run(command, args, cwd = undefined) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed (code=${String(code)}, signal=${String(signal)})`));
    });
  });
}

function capture(command, args) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, args, { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} ${args.join(" ")} failed (code=${String(code)}, signal=${String(signal)}): ${stderr.trim()}`));
    });
  });
}
