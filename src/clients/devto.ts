import axios, { AxiosInstance } from "axios";
import { Post } from "../types/post";
import { normalizeTag } from "../utils/normalize-tag";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { DevToConfigSchema } from "../config/schema";
import { Image } from "mdast";

type ArticleData = {
  body_markdown: string;
  organization_id?: string;
  published: boolean;
  title: string;
  series?: string;
  description?: string;
  canonical_url?: string;
  tags?: string[];
  date?: string;
};

class DevToClient {
  connection_settings: DevToConfigSchema["connection_settings"];
  options: DevToConfigSchema["options"];
  postData: Post;
  client: AxiosInstance;
  giphyClient: AxiosInstance | undefined;
  dryRun: boolean;

  constructor(config: DevToConfigSchema, postData: Post, dryRun: boolean) {
    this.connection_settings = config.connection_settings;
    this.options = config.options || {};
    this.postData = postData;
    this.dryRun = dryRun;

    this.client = axios.create({
      baseURL: "https://dev.to/api/",
      headers: {
        "api-key": this.connection_settings.api_key,
        Accept: "application/vnd.forem.api-v1+json",
      },
    });

    if (this.connection_settings.giphy_api_key) {
      this.giphyClient = axios.create({
        baseURL: "https://upload.giphy.com/v1/",
        params: {
          api_key: this.connection_settings.giphy_api_key,
        },
      });
    }
  }

  private async uploadToGiphy(gifUrl: string): Promise<string | undefined> {
    if (!this.giphyClient) {
      console.warn("Giphy API key not configured, skipping GIF upload");
      return undefined;
    }

    if (this.dryRun) {
      return "https://media.giphy.com/media/example/giphy.gif";
    }

    try {
      const response = await this.giphyClient.post("gifs", {
        source_image_url: gifUrl,
        tags: ["blog", this.postData.slug],
        source_post_url: this.postData.canonical_url,
      });

      if (response.data?.data?.id) {
        return `https://media.giphy.com/media/${response.data.data.id}/giphy.gif`;
      }
    } catch (error) {
      console.error("Failed to upload GIF to Giphy:", error);
    }
    return undefined;
  }

  private async sanitizeMarkdown(markdown: string): Promise<string> {
    const sanitized = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(
        // Remove metadata from code blocks because they are not recognized by devto
        () => (tree) => {
          visit(tree, (node) => {
            if (node.type === "code") {
              (node as any).meta = "";
            }
          });
        }
      )
      .use(
        // Handle GIFs by uploading them to Giphy
        () => async (tree) => {
          const promises: Promise<void>[] = [];
          visit(tree, "image", (node: Image) => {
            if (node.url.toLowerCase().endsWith(".gif")) {
              promises.push(
                (async () => {
                  const giphyUrl = await this.uploadToGiphy(node.url);
                  if (giphyUrl) {
                    node.url = giphyUrl;
                  }
                })()
              );
            }
          });
          await Promise.all(promises);
        }
      )
      .use(remarkStringify)
      .process(markdown);
    return String(sanitized);
  }

  async post() {
    const normalizedTags = this.postData.tags
      ? this.postData.tags.map((tag) => normalizeTag(tag))
      : [];

    const sanitizedMarkdown = await this.sanitizeMarkdown(
      this.postData.markdown
    );

    //format data
    const article: ArticleData = {
      body_markdown: sanitizedMarkdown,
      organization_id: this.connection_settings.organization_id,
      published: this.options.should_publish,
      title: this.postData.title,
      // ...(this.postData.series && { series: this.postData.series }),
      ...(this.postData.description && {
        description: this.postData.description,
      }),
      ...(this.postData.canonical_url && {
        canonical_url: this.postData.canonical_url,
      }),
      ...(this.postData.image && {
        main_image: this.postData.image,
      }),
      ...(this.postData.tags && {
        tags: normalizedTags,
      }),
      // ...(this.postData.date && { date: this.postData.date }),
    };

    if (this.dryRun) {
      console.log("Article prepared for dev.to:", article);
      console.log("No error occurred while preparing article for dev.to.");
      return;
    }

    //post to dev.to
    await this.client.post("articles", {
      article,
    });

    console.log("Article pushed to Dev.to");
  }
}

export default DevToClient;
