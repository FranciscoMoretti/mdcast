import DevToClient from "../clients/devto";
import HashnodeClient from "../clients/hashnode";
import { markdownToPost } from "../utils/markdown-to-post";
import MediumClient from "../clients/medium";
import Config from "../types/config";
import GlobalOptions, { Platforms } from "../types/global-options";
import { Post } from "../types/post";
import MarkdownClient from "../clients/markdown";
import { validatePath } from "../utils/validate-path";

type PostOptions = GlobalOptions & {
  platforms: Platforms[];
  dryRun: boolean;
};

export default async function post(
  path: string,
  { config, platforms, dryRun }: PostOptions
) {
  const promises = [];
  validatePath(path);

  const markdownClient = new MarkdownClient(path);
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
