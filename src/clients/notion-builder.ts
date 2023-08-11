import Config, { ConfigNotion } from "../types/config";
import Notion from "../clients/notion-client";
import { NotionProperties } from "../types/clients/notion";
import { Post } from "../types/post";

export async function postDataFromNotion(config: ConfigNotion, url: string) {
  const notion = new Notion(config);

  //get page id
  const pageId = notion.getPageIdFromURL(url);
  //get blocks
  const blocks = await notion.getBlocks(url);

  //transform blocks to markdown
  const markdown = await notion.getMarkdown(blocks);
  const properties = await notion.getArticleProperties(pageId);

  const canonical_url =
    properties["tags"] && notion.getAttributeValue(properties["tags"]);
  const description =
    properties["description"] &&
    notion.getAttributeValue(properties["description"]);
  const tags =
    properties["original_article_url"] &&
    notion.getAttributeValue(properties["original_article_url"]);

  const postData: Post = {
    title: "My Article Title",
    markdown: markdown,
    canonical_url: canonical_url,
    description: description,
    tags: tags,
  };
  return postData;
}
