import { defineConfig } from "niceeval";

export default defineConfig({
  name: {
    en: "NiceEval deterministic preview",
    "zh-CN": "NiceEval 确定性预览",
  },
  timeoutMs: 90_000,
  maxConcurrency: 4,
  pricing: {
    "preview-baseline": {
      inputPerMTok: 1.25,
      outputPerMTok: 5,
      cacheReadPerMTok: 0.125,
      cacheWritePerMTok: 1.5,
    },
    "preview-candidate": {
      inputPerMTok: 2,
      outputPerMTok: 8,
      cacheReadPerMTok: 0.2,
      cacheWritePerMTok: 2.4,
    },
    "preview-sandbox": {
      inputPerMTok: 0,
      outputPerMTok: 0,
    },
  },
});
