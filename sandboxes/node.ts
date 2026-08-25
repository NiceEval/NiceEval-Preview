import { dockerSandbox } from "niceeval/sandbox";

/**
 * Official, immutable Node 24 runtime used only while regenerating the Record.
 * NiceEval pulls it on a cold Docker host and reuses Docker's local cache.
 * Static report rendering reads the committed Record and never starts Docker.
 */
export const PREVIEW_NODE_IMAGE =
  "node:24-slim@sha256:cd84903a12dbd26b46f1f3b8144a2568c41c5d37ddd0c7a80a34c7a19786b35f";

export function previewNodeSandbox() {
  return dockerSandbox({
    source: { type: "image", image: PREVIEW_NODE_IMAGE },
    user: "node",
    lifetimeMs: 10 * 60_000,
  });
}
