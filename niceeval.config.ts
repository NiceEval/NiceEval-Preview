import { defineConfig } from "niceeval";
import { loadEnvFile } from "node:process";

loadEnvFile();

export default defineConfig({
  name: {
    en: "NiceEval Preview",
    "zh-CN": "NiceEval 预览",
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
    "preview-score-low": {
      inputPerMTok: 1.25,
      outputPerMTok: 5,
      cacheReadPerMTok: 0.125,
      cacheWritePerMTok: 1.5,
    },
    "preview-score-medium": {
      inputPerMTok: 2,
      outputPerMTok: 8,
      cacheReadPerMTok: 0.2,
      cacheWritePerMTok: 2.4,
    },
    "preview-score-high": {
      inputPerMTok: 2.25,
      outputPerMTok: 9,
      cacheReadPerMTok: 0.225,
      cacheWritePerMTok: 2.7,
    },
    "preview-score-divergent": {
      inputPerMTok: 3,
      outputPerMTok: 12,
      cacheReadPerMTok: 0.3,
      cacheWritePerMTok: 3.6,
    },
    "preview-sandbox": {
      inputPerMTok: 0,
      outputPerMTok: 0,
    },
  },
});
