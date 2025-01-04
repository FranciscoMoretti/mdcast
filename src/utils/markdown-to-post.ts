import { Post } from "../types/post";
import MarkdownClient from "../clients/markdown";

export async function markdownToPost(markdownClient: MarkdownClient) {
  await markdownClient.setup();

  const markdown = await markdownClient.getMarkdown();
  const title = await markdownClient.getTitle();
  const description = await markdownClient.getDescription();
  const tags = await markdownClient.getTags();
  const image = await markdownClient.getImage();
  const slug = await markdownClient.getSlug();

  const canonical_url = `${markdownClient.config.canonical_url_base}/${slug}`;
  const image_url = image
    ? `${markdownClient.config.image_url_base}${image}`
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
