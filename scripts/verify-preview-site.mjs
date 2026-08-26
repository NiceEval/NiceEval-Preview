import { lstat, readdir, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const publishRoot = resolve(repositoryRoot, process.env.PREVIEW_PUBLISH_DIR ?? ".preview-site");
const allowedExtensions = new Set([".css", ".gif", ".html", ".ico", ".jpeg", ".jpg", ".js", ".json", ".mjs", ".png", ".svg", ".wasm", ".webp", ".woff", ".woff2"]);
const prohibitedPath = /(?:^|\/)(?:\.niceeval|\.env(?:\.|$)|[^/]*\.(?:db|sqlite(?:3)?|pem|key))(?:\/|$)/iu;

assertInsideRepository(publishRoot);
const files = await walk(publishRoot);
if (!files.includes("index.html")) throw new Error("published ViewRevision is missing index.html");
if (files.length === 0) throw new Error("published ViewRevision is empty");

for (const file of files) {
  if (prohibitedPath.test(file)) throw new Error(`published ViewRevision contains prohibited path: ${file}`);
  const dot = file.lastIndexOf(".");
  const slash = file.lastIndexOf("/");
  const extension = dot > slash ? file.slice(dot).toLowerCase() : "";
  if (!allowedExtensions.has(extension)) throw new Error(`published ViewRevision contains non-allowlisted file: ${file}`);
  const bytes = await readFile(resolve(publishRoot, file));
  if (extension === ".json") verifyViewPage(file, bytes);
  if (bytes.subarray(0, 16).equals(Buffer.from("SQLite format 3\u0000"))) {
    throw new Error(`published ViewRevision contains SQLite data: ${file}`);
  }
  if (/BEGIN (?:[A-Z ]+ )?PRIVATE KEY/u.test(bytes.toString("utf8"))) {
    throw new Error(`published ViewRevision contains private-key material: ${file}`);
  }
}

process.stdout.write(`verified ${files.length} allowlisted ViewRevision files in ${relative(repositoryRoot, publishRoot)}\n`);

function verifyViewPage(file, bytes) {
  if (!file.endsWith(".view.json")) {
    throw new Error(`published ViewRevision contains non-page JSON: ${file}`);
  }
  let page;
  try {
    page = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`published ViewRevision contains invalid page JSON: ${file}`);
  }
  const keys = typeof page === "object" && page !== null && !Array.isArray(page)
    ? Object.keys(page).sort()
    : [];
  if (
    keys.join("\0") !== ["en", "format", "zh-CN"].join("\0") ||
    page.format !== "niceeval.view-page/v1" ||
    typeof page.en !== "string" ||
    typeof page["zh-CN"] !== "string"
  ) {
    throw new Error(`published ViewRevision contains Inspection or unknown JSON: ${file}`);
  }
}

async function walk(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = resolve(root, entry.name);
    const file = relative(publishRoot, target).split(sep).join("/");
    if (entry.isDirectory()) result.push(...(await walk(target)));
    else if (entry.isFile()) result.push(file);
    else {
      const details = await lstat(target);
      if (details.isSymbolicLink()) throw new Error(`published ViewRevision contains symlink: ${file}`);
      throw new Error(`published ViewRevision contains unsupported entry: ${file}`);
    }
  }
  return result.sort();
}

function assertInsideRepository(path) {
  if (path === repositoryRoot || !path.startsWith(`${repositoryRoot}${sep}`)) {
    throw new Error("PREVIEW_PUBLISH_DIR must resolve inside the NiceEval-Preview repository");
  }
}
