import Config, { ConfigNotion } from "../types/config";
import Notion from "./notion-client";
import { NotionProperties } from "../types/clients/notion";
import { Post } from "../types/post";
import path from "path";
import Markdown from "./markdown-client";

export async function postDataFromMarkdown(
  config: ConfigNotion,
  filePath: string
) {
  // const filePath = path.resolve(process.cwd(), url);
  // publish from a local file
  if (path.extname(filePath).toLowerCase().indexOf("md") === -1) {
    console.log('File extension not allowed. Only ".md" files are allowed');
    throw Error("Incorrect file extension provided");
  }

  const client = new Markdown(config, filePath);
  await client.setup();

  const markdown = await client.getMarkdown();
  const title = await client.getTitle();
  const description = await client.getDescription();
  const tags = await client.getTags();
  const image = await client.getImage();
  const slug = await client.getSlug();

  const canonical_url = `https://www.franciscomoretti.com/blog/${slug}`;
  const image_url = image
    ? `https://www.franciscomoretti.com${image}`
    : undefined;

  const postData: Post = {
    title: title,
    markdown: markdown,
    description: description,
    canonical_url: canonical_url,
    tags: tags,
    image: image_url,
  };
  return postData;
}
