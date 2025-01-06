#!/usr/bin/env node
import post from "./commands/post";
import { Command, program } from "commander";
import { Platforms } from "./types/global-options";
import { getPackageInfo } from "./utils/get-package-info";
import { init } from "./commands/init";

async function main() {
  const packageInfo = await getPackageInfo();

  program
    .usage("[command] [options]")
    .version(packageInfo.version || "1.0.0", "-v, --version");

  const postCommand = new Command()
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

  program.addCommand(init).addCommand(postCommand);

  program.parse();
}

main();
