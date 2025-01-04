import DevToClient from "../clients/devto";
import HashnodeClient from "../clients/hashnode";
import { markdownToPost } from "../utils/markdown-to-post";
import MediumClient from "../clients/medium";
import { Platforms } from "../types/global-options";
import { Post } from "../types/post";
import MarkdownClient from "../clients/markdown";
import { validatePath } from "../utils/validate-path";
import { DEFAULT_CONFIG_FILENAME, getConfig } from "../utils/get-config";
import chalk from "chalk";
import { handleError } from "../utils/handle-error";

type PostOptions = {
  platforms: Platforms[];
  dryRun: boolean;
};

export default async function post(
  path: string,
  { platforms, dryRun }: PostOptions
) {
  // Let's get the config directly in post command
  const config = await getConfig(process.cwd());
  if (!config) {
    handleError(
      `Configuration is missing. Please run ${chalk.green(
        `init`
      )} to create a ${DEFAULT_CONFIG_FILENAME} file.`
    );
  }

  // TODO: IF location is provided instead of API key, the token needs to be read from the environment variable

  const promises = [];
  validatePath(path);

  const markdownClient = new MarkdownClient(path, config.markdown);
  const postData: Post = await markdownToPost(markdownClient);

  if (platforms.includes(Platforms.DEVTO)) {
    const devto = new DevToClient(config.devto, postData);
    promises.push(devto.post(dryRun));
  }

  if (platforms.includes(Platforms.HASHNODE)) {
    const hashnode = new HashnodeClient(config.hashnode, postData);
    promises.push(hashnode.post(dryRun));
  }

  if (platforms.includes(Platforms.MEDIUM)) {
    const medium = new MediumClient(config.medium, postData);
    promises.push(medium.post(dryRun));
  }

  await Promise.all(promises).then(() =>
    console.log("Finished posting the article")
  );
}
