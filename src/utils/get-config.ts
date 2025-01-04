import { cosmiconfig } from "cosmiconfig";
import { ConfigSchema } from "../config/schema";
import type { z } from "zod";

export const DEFAULT_CONFIG_FILENAME = "crosspost.json";

const explorer = cosmiconfig("crosspost", {
  searchPlaces: [
    "crosspost.json",
    "crosspost.config.js",
    "crosspost.config.cjs",
    "crosspost.config.ts",
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
