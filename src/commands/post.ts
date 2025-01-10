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
import { env } from "../env";

type PostOptions = {
  platforms: Platforms[];
  dryRun: boolean;
};

function validateEnvVars(platform: Platforms) {
  switch (platform) {
    case Platforms.DEVTO:
      if (!env.DEVTO_API_KEY) {
        handleError(
          "DEVTO_API_KEY env variable is required for Dev.to platform"
        );
      }
      break;
    case Platforms.HASHNODE:
      if (!env.HASHNODE_TOKEN) {
        handleError(
          "HASHNODE_TOKEN env variable is required for Hashnode platform"
        );
      }
      if (!env.HASHNODE_PUB_ID) {
        handleError(
          "HASHNODE_PUB_ID env variable is required for Hashnode platform"
        );
      }
      break;
    case Platforms.MEDIUM:
      if (!env.MEDIUM_TOKEN) {
        handleError(
          "MEDIUM_TOKEN env variable is required for Medium platform"
        );
      }
      break;
  }
}

export default async function post(
  path: string,
  { platforms, dryRun }: PostOptions
) {
  const config = await getConfig(process.cwd());
  if (!config) {
    handleError(
      `Configuration is missing. Please run ${chalk.green(
        `init`
      )} to create a ${DEFAULT_CONFIG_FILENAME} file.`
    );
  }
  const promises = [];
  validatePath(path);

  const markdownClient = new MarkdownClient(path, config.markdown);
  const postData: Post = await markdownToPost(markdownClient);

  // Validate env vars for each requested platform
  platforms.forEach(validateEnvVars);

  if (platforms.includes(Platforms.DEVTO)) {
    const connection_settings = {
      api_key: env.DEVTO_API_KEY!,
      organization_id: env.DEVTO_ORG_ID,
    };
    const devto = new DevToClient(
      {
        options: config.devto,
        connection_settings,
      },
      postData
    );
    promises.push(devto.post(dryRun));
  }

  if (platforms.includes(Platforms.HASHNODE)) {
    const connection_settings = {
      token: env.HASHNODE_TOKEN!,
      publication_id: env.HASHNODE_PUB_ID,
    };
    const hashnode = new HashnodeClient(
      {
        options: config.hashnode,
        connection_settings,
      },
      postData
    );
    promises.push(hashnode.post(dryRun));
  }

  if (platforms.includes(Platforms.MEDIUM)) {
    const connection_settings = {
      token: env.MEDIUM_TOKEN!,
      publication_name: env.MEDIUM_PUBLICATION_NAME,
    };
    const medium = new MediumClient(
      {
        options: config.medium,
        connection_settings: connection_settings,
      },
      postData
    );
    promises.push(medium.post(dryRun));
  }

  await Promise.all(promises).then(() =>
    console.log("Finished posting the article")
  );
}
