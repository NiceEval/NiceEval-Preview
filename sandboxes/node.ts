import { dockerSandbox } from "niceeval/sandbox";

/**
 * Cached, immutable Node 24 runtime used only while regenerating the Record.
 * Static report rendering reads the committed Record and never starts Docker.
 */
export const PREVIEW_NODE_IMAGE =
  "offline.invalid/niceeval-harness/runtime:node@sha256:1e0d594317c429f60cd5b116bc31b3ffd76f5b3ff0217e562da88dd3e46f7ed3";

export function previewNodeSandbox() {
  return dockerSandbox({
    source: { type: "image", image: PREVIEW_NODE_IMAGE },
    user: "node",
    lifetimeMs: 10 * 60_000,
  });
}
