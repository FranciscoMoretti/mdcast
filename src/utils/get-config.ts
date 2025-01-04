import { cosmiconfig } from "cosmiconfig";
import { ConfigSchema } from "../config/schema";
import type { z } from "zod";

export const DEFAULT_CONFIG_FILENAME = "mdcast.json";

const explorer = cosmiconfig("mdcast", {
  searchPlaces: [
    "mdcast.json",
    "mdcast.config.js",
    "mdcast.config.cjs",
    "mdcast.config.ts",
  ],
});

export type Config = z.infer<typeof ConfigSchema>;

export async function getConfig(cwd: string): Promise<Config | null> {
  try {
    const result = await explorer.search(cwd);
    if (!result) return null;

    return ConfigSchema.parse(result.config);
  } catch (error) {
    throw new Error(
      `Invalid configuration found in ${cwd} configuration file. Error: ${error}`
    );
  }
}
