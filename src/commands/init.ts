import { existsSync, promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_CONFIG_FILENAME,
  getConfig,
  type Config,
} from "@/src/utils/get-config";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import prompts from "prompts";
import { z } from "zod";
import { ConfigSchema } from "../config/schema";

const initOptionsSchema = z.object({
  cwd: z.string(),
  // yes: z.boolean(),
  // defaults: z.boolean(),
});

export const init = new Command()
  .name("init")
  .description("initialize your project and install dependencies")
  // .option("-y, --yes", "skip confirmation prompt.", false)
  // TODO: Implement this defaults option
  // .option("-d, --defaults,", "use default configuration.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    try {
      const options = initOptionsSchema.parse(opts);
      const cwd = path.resolve(options.cwd);

      // Ensure target directory exists.
      if (!existsSync(cwd)) {
        handleError(`The path ${cwd} does not exist. Please try again.`);
      }

      const existingConfig = await getConfig(cwd);
      if (existingConfig) {
        logger.info(
          `Configuration files already exist in directory ${cwd}. This operation will have no effect.`
        );
      } else {
        const config = ConfigSchema.parse({});
        await runInit(cwd, config, options.yes);
      }

      logger.info("");
      logger.info(
        `${chalk.green(
          "Success!"
        )} Project initialization completed. You may now run ${chalk.green(
          "mdcast post"
        )} to post your content.`
      );
      logger.info("");
    } catch (error) {
      handleError(error);
    }
  });

export async function runInit(
  cwd: string,
  config: Config,
  skipConfirmation: boolean
) {
  if (!skipConfirmation) {
    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: `Write configuration to ${chalk.green(
        DEFAULT_CONFIG_FILENAME
      )}. Proceed?`,
      initial: true,
    });

    if (!proceed) {
      process.exit(0);
    }
  }
  logger.info("");
  const spinner = ora(`Writing ${DEFAULT_CONFIG_FILENAME}...`).start();
  const targetPath = path.resolve(cwd, DEFAULT_CONFIG_FILENAME);
  await fs.writeFile(targetPath, JSON.stringify(config, null, 2), "utf8");
  spinner.succeed();
}
