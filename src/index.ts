#! /usr/bin/env tsx

// TODO: Verify if shebang should be node instead of tsx
import "dotenv/config"; // Needs to be on top to run dotenv.config
import fs from "fs";
import { env } from "./env";

//config must be loaded before importing
//any file that imports `config`
// dotenv.config();

// process.env.SUPPRESS_NO_CONFIG_WARNING = "y";
// process.env["NODE_CONFIG_DIR"] =
//   __dirname + "/config/" + path.delimiter + "./config/";
import config from "config";
import post from "./commands/post";
import { program } from "commander";
import { Platforms } from "./types/global-options";

program
  .usage("[command] [options]")
  .version("0.1.5", "-v, --version")
  .option(
    "-c, --config <path>",
    "Path to a JSON config file. By default, config files are loaded from config/default.json"
  )
  .hook("preAction", (thisCommand, actionCommand) => {
    const configOption = thisCommand.opts().config;
    let fullConfig;
    if (configOption) {
      fullConfig = JSON.parse(fs.readFileSync(configOption).toString()).config;
    } else {
      fullConfig = config.get("config");
    }

    actionCommand.setOptionValue("config", fullConfig);
  });

program
  .command("post <path>")
  .description("Cross post article")
  .action(post)
  .option(
    "-p, --platforms [platforms...]",
    "Platforms to publish the article on.",
    Object.values(Platforms)
  )
  .option(
    "-d, --dryRun",
    "If this option is passed, the entire process runs without actually posting the article. Useful for testing.",
    false
  );

program.parse();
