import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  /*
   * Specify what prefix the client-side variables must have.
   * This is enforced both on type-level and at runtime.
   */
  clientPrefix: "PUBLIC_",
  server: {
    DEVTO_API_KEY: z.string().optional(),
    DEVTO_ORG_ID: z.string().optional(),
    HASHNODE_TOKEN: z.string().optional(),
    HASHNODE_PUBLICATION_ID: z.string().optional(),
    MEDIUM_TOKEN: z.string().optional(),
    MEDIUM_PUBLICATION_NAME: z.string().optional(),
  },
  client: {},
  /**
   * What object holds the environment variables at runtime.
   * Often `process.env` or `import.meta.env`
   */
  runtimeEnv: process.env,
});
