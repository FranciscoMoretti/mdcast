#!/usr/bin/env node
import "dotenv/config";
import post from "./commands/post";
import { program } from "commander";
import { Platforms } from "./types/global-options";
import { getPackageInfo } from "./utils/get-package-info";

async function main() {
  const packageInfo = await getPackageInfo();

  program
    .usage("[command] [options]")
    .version(packageInfo.version || "1.0.0", "-v, --version");

  // TODO: Create a INIT command

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
}

main();
