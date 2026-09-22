import { defineApp } from "convex/server";
import { v } from "convex/values";
import staticHosting from "@convex-dev/static-hosting/convex.config";

const app = defineApp({
  env: {
    LLM_API_KEY: v.optional(v.string()),
    LLM_BASE_URL: v.optional(v.string()),
    LLM_MODEL: v.optional(v.string()),
    FIRECRAWL_API_KEY: v.optional(v.string()),
    AGENTMAIL_API_KEY: v.optional(v.string()),
  },
});
app.use(staticHosting); // keep app HTTP routes at root

export default app;
