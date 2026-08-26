import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { withPinnedCandidate } from "./pinned-candidate.mjs";
import { withSealedPreviewRecord } from "./preview-record-fixture.mjs";

const repositoryRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const publishRoot = resolve(repositoryRoot, process.env.PREVIEW_PUBLISH_DIR ?? ".preview-site");
const allowedContentTypes = new Map([
  ["text/html", new Set([".html"])],
  ["text/css", new Set([".css"])],
  ["application/javascript", new Set([".js", ".mjs"])],
  ["text/javascript", new Set([".js", ".mjs"])],
  ["application/json", new Set([".json"])],
  ["application/wasm", new Set([".wasm"])],
  ["image/svg+xml", new Set([".svg"])],
  ["image/png", new Set([".png"])],
  ["image/jpeg", new Set([".jpeg", ".jpg"])],
  ["image/gif", new Set([".gif"])],
  ["image/webp", new Set([".webp"])],
  ["image/x-icon", new Set([".ico"])],
  ["font/woff", new Set([".woff"])],
  ["font/woff2", new Set([".woff2"])],
]);
const maximumFiles = 256;
const maximumFileBytes = 10 * 1024 * 1024;

assertInsideRepository(publishRoot);
await withPinnedCandidate(repositoryRoot, async ({ consumerRoot, sha, source }) => {
  // The CI/Netlify path owns its candidate and typechecks it. The explicit
  // installed-candidate escape hatch is for a parent agent's already-validated
  // final link (and also permits a compatibility smoke against the release).
  if (source === "pinned") await run("pnpm", ["typecheck"], consumerRoot);
  await withSealedPreviewRecord(consumerRoot, async ({ project, snapshot }) => {
    await rebuildPublishedView(consumerRoot, project, snapshot);
  });
  process.stdout.write(`built static ViewRevision from ${source === "pinned" ? sha : "the installed candidate"}\n`);
});

async function rebuildPublishedView(consumerRoot, project, record) {
  await rm(publishRoot, { recursive: true, force: true });
  await mkdir(publishRoot, { recursive: true });
  const executable = resolve(consumerRoot, "node_modules", ".bin", process.platform === "win32" ? "niceeval.cmd" : "niceeval");
  const child = spawn(executable, ["view", "--record", record, "--no-open", "--port", "0", "--json"], {
    cwd: project,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const lifecycle = lifecycleCollector();
  const exited = onceExit(child);
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => lifecycle.push(chunk));
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  try {
    const ready = await waitForReady(lifecycle);
    const bootstrapUrl = new URL(ready.url);
    assertProtectedLoopbackUrl(bootstrapUrl);
    const bootstrap = await fetch(bootstrapUrl, { redirect: "error" });
    if (!bootstrap.ok) throw new Error(`View bootstrap returned ${bootstrap.status}`);
    const session = await fetch(new URL("/_niceeval/session", bootstrapUrl), {
      method: "POST",
      headers: { "content-type": "application/json", origin: bootstrapUrl.origin },
      body: JSON.stringify({ credential: bootstrapUrl.hash.slice(1) }),
      redirect: "error",
    });
    const cookie = requestCookie(session);
    if (session.status !== 204 || cookie === undefined) throw new Error("View did not exchange its one-time loopback credential");
    await crawlRevision(new URL("/", bootstrapUrl), cookie);
  } finally {
    if (child.exitCode === null && !child.kill("SIGTERM")) throw new Error("View process did not accept SIGTERM");
    const exit = await boundedExit(child, exited, 10_000);
    lifecycle.finish();
    const ready = lifecycle.events.filter((event) => event.event === "ready");
    const terminal = lifecycle.events.filter((event) => event.event === "closed" || event.event === "failed");
    if (
      exit.code !== 0 || ready.length !== 1 || terminal.length !== 1 ||
      terminal[0]?.event !== "closed" || lifecycle.events.at(-1)?.event !== "closed"
    ) {
      throw new Error(`View did not close cleanly (code=${String(exit.code)}, stderrBytes=${Buffer.byteLength(stderr)})`);
    }
  }
}

async function crawlRevision(entry, cookie) {
  const queue = [entry];
  const queued = new Set([entry.href]);
  const written = new Map();
  while (queue.length > 0) {
    if (written.size >= maximumFiles) throw new Error(`ViewRevision exceeded the ${maximumFiles}-file allowlist`);
    const target = queue.shift();
    const destination = outputPath(target);
    const response = await fetch(target, {
      headers: { cookie, origin: entry.origin },
      redirect: "error",
    });
    if (!response.ok) throw new Error(`ViewRevision resource ${target.pathname} returned ${response.status}`);
    const contentType = response.headers.get("content-type")?.split(";", 1)[0].toLowerCase();
    if (contentType === undefined || !allowedContentTypes.has(contentType)) {
      throw new Error(`ViewRevision resource ${target.pathname} has non-allowlisted content type ${String(contentType)}`);
    }
    assertTypeMatchesPath(contentType, destination);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > maximumFileBytes) throw new Error(`ViewRevision resource ${target.pathname} exceeds ${maximumFileBytes} bytes`);
    const known = written.get(destination);
    if (known !== undefined && !known.equals(bytes)) {
      throw new Error(`ViewRevision mapped distinct bytes to one static path: ${destination}`);
    }
    if (known === undefined) {
      await mkdir(dirname(resolve(publishRoot, destination)), { recursive: true });
      await writeFile(resolve(publishRoot, destination), bytes);
      written.set(destination, bytes);
    }
    for (const reference of references(bytes, contentType)) {
      const resolved = resolveReference(reference, target, entry.origin);
      if (resolved !== undefined && !queued.has(resolved.href)) {
        queued.add(resolved.href);
        queue.push(resolved);
      }
    }
  }
}

function references(bytes, contentType) {
  const source = bytes.toString("utf8");
  if (contentType === "text/html") return htmlReferences(source);
  if (contentType === "text/css") return cssReferences(source);
  if (contentType === "application/javascript" || contentType === "text/javascript") return javaScriptReferences(source);
  return [];
}

function htmlReferences(source) {
  const found = [];
  if (/<base\b/iu.test(source)) throw new Error("ViewRevision must not set an HTML base URL");
  for (const match of source.matchAll(/<(a|link|script|img|source)\b([^>]*)>/giu)) {
    const tag = match[1].toLowerCase();
    const attributes = match[2];
    if (tag === "a") {
      for (const value of attributeValues(attributes, "href")) found.push({ value });
      continue;
    }
    if (tag === "link" && !isAssetLink(attributes)) {
      if (attributeValues(attributes, "href").length > 0) {
        throw new Error("ViewRevision contains a non-static link relation");
      }
      continue;
    }
    for (const value of attributeValues(attributes, tag === "link" ? "href" : "src")) {
      found.push({ value });
    }
    for (const srcset of attributeValues(attributes, "srcset")) {
      for (const candidate of srcset.split(",")) {
        const value = candidate.trim().split(/\s+/u, 1)[0];
        if (value.length > 0) found.push({ value });
      }
    }
  }
  // The fixed renderer keeps localized page fragments in one adjacent,
  // presentation-only ViewRevision file loaded by the shared script.
  for (const match of source.matchAll(/\bdata-view-page\s*=\s*(["'])(.*?)\1/giu)) {
    found.push({ value: match[2] });
  }
  return found;
}

function isAssetLink(attributes) {
  const relations = attributeValues(attributes, "rel").flatMap((value) => value.toLowerCase().split(/\s+/u));
  return relations.some((relation) => ["icon", "modulepreload", "preload", "stylesheet"].includes(relation));
}

function attributeValues(attributes, name) {
  const expression = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "giu");
  const values = [];
  for (const match of attributes.matchAll(expression)) {
    values.push(match[1] ?? match[2] ?? match[3] ?? "");
  }
  return values;
}

function cssReferences(source) {
  const found = [];
  for (const match of source.matchAll(/(?:url\(\s*|@import\s+)(?:["'])?([^"')\s]+)(?:["'])?\s*\)?/giu)) {
    found.push({ value: match[1] });
  }
  return found;
}

function javaScriptReferences(source) {
  const found = [];
  for (const match of source.matchAll(/(?:import\s*(?:\(|[^"']*?from\s*)|export\s+[^"']*?from\s*)(["'])([^"']+)\1/giu)) {
    found.push({ value: match[2] });
  }
  return found;
}

function resolveReference(reference, base, origin) {
  if (reference.value.length === 0 || reference.value.startsWith("#")) return undefined;
  const target = new URL(reference.value, base);
  if (target.protocol !== "http:" && target.protocol !== "https:") return undefined;
  if (target.username.length > 0 || target.password.length > 0) {
    throw new Error(`ViewRevision resource has URL credentials: ${target.href}`);
  }
  if (target.origin !== origin) {
    throw new Error(`ViewRevision contains an external resource: ${target.href}`);
  }
  target.hash = "";
  return target;
}

function outputPath(url) {
  const encodedSegments = url.pathname.split("/").filter(Boolean);
  const decodedSegments = encodedSegments.map((segment) => decodeURIComponent(segment));
  if (decodedSegments.some((segment) =>
    segment === "." ||
    segment === ".." ||
    segment.includes("/") ||
    segment.includes("\\") ||
    segment.includes("\0")
  )) {
    throw new Error(`ViewRevision resource has unsafe path: ${url.pathname}`);
  }
  const path = decodedSegments.join("/");
  if (path.length === 0) return "index.html";
  if (url.pathname.endsWith("/")) return `${path}/index.html`;
  return path;
}

function assertTypeMatchesPath(contentType, path) {
  const dot = path.lastIndexOf(".");
  const slash = path.lastIndexOf("/");
  const extension = dot > slash ? path.slice(dot).toLowerCase() : "";
  if (!allowedContentTypes.get(contentType).has(extension)) {
    throw new Error(`ViewRevision resource type ${contentType} does not match allowlisted path ${path}`);
  }
}

function assertProtectedLoopbackUrl(url) {
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]", "localhost"].includes(url.hostname) || url.hash.length <= 1) {
    throw new Error("View ready event did not contain a protected loopback URL");
  }
}

function requestCookie(response) {
  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter((value) => value !== null);
  const pairs = setCookies
    .map((value) => value.split(";", 1)[0]?.trim() ?? "")
    .filter((value) => value.length > 0);
  return pairs.length > 0 ? pairs.join("; ") : undefined;
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
      failure = new Error("View stdout contained invalid lifecycle JSON");
      return;
    }
    if (event.protocol !== "niceeval.view-lifecycle/v1" || typeof event.event !== "string") {
      failure = new Error("View stdout contained a non-lifecycle event");
      return;
    }
    events.push(event);
  };
  return Object.freeze({
    events,
    push(chunk) {
      if (failure !== undefined) return;
      pending += chunk;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) if (line.length > 0) parseLine(line);
    },
    finish() {
      if (failure !== undefined) throw failure;
      if (pending.length > 0) throw new Error("View stdout ended with incomplete lifecycle JSON");
    },
    get failure() { return failure; },
  });
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
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("View did not exit within shutdown deadline")), timeoutMs); }),
    ]);
  } catch (error) {
    if (child.exitCode === null) child.kill("SIGKILL");
    await exited.catch(() => undefined);
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function assertInsideRepository(path) {
  if (path === repositoryRoot || !path.startsWith(`${repositoryRoot}${sep}`)) {
    throw new Error("PREVIEW_PUBLISH_DIR must resolve inside the NiceEval-Preview repository");
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed (code=${String(code)}, signal=${String(signal)})`));
    });
  });
}
