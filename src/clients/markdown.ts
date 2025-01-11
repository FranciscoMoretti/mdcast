import fs from "fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkParseFrontmatter from "remark-parse-frontmatter";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { Literal, Nodes, Root, RootContent } from "mdast";
import { MarkdownConfig } from "../config/schema";
import { off } from "process";
import { handleError } from "../utils/handle-error";

interface TOML extends Literal {
  type: "toml";
}

declare module "mdast" {
  interface RootContentMap {
    // Allow using toml nodes defined by `remark-frontmatter`.
    toml: TOML;
  }
}

function normalizeObsidianAbsolutePath(path: string): string {
  if (
    !path.startsWith("/") &&
    !(path.startsWith("www") || path.startsWith("http") || path.startsWith("#"))
  ) {
    return "/" + path;
  }
  return path;
}

function removeFileExtension(filePath: string): string {
  const lastDotIndex = filePath.lastIndexOf(".");
  const fileNameWithoutExtension =
    lastDotIndex !== -1 ? filePath.slice(0, lastDotIndex) : filePath;
  return fileNameWithoutExtension;
}

class MarkdownClient {
  filePath: string;
  file: any;
  config: MarkdownConfig;

  constructor(filePath: string, config: MarkdownConfig) {
    this.filePath = filePath;
    this.config = config;
    this.file = "";
  }

  async setup(): Promise<void> {
    this.file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkFrontmatter, ["yaml", "toml"])
      .use(remarkParseFrontmatter)
      .use(
        // Replace local image paths with site url
        () => (tree: Root) => {
          visit(tree, (node: Nodes) => {
            if (node.type === "image") {
              node.url = normalizeObsidianAbsolutePath(node.url);
              if (node.url.startsWith("/")) {
                if (!this.config.image_url_base) {
                  handleError(
                    `image_url_base is not set in the config file, but needed to replace local image "${node.url}"`
                  );
                }
                node.url = this.config.image_url_base + node.url;
              }
            }
          });
        }
      )
      .use(
        // Replace local links with site url
        () => (tree: Root) => {
          visit(tree, (node: Nodes) => {
            if (node.type === "link") {
              let { url } = node;
              url = normalizeObsidianAbsolutePath(url);
              if (url.startsWith("/")) {
                if (!this.config.link_url_base) {
                  handleError(
                    `link_url_base is not set in the config file, but needed to replace local link "${url}"`
                  );
                }
                url = removeFileExtension(url);
                url = this.config.link_url_base + url;
              }
              node.url = url;
            }
          });
        }
      )
      .use(
        // Insert default lang in code blocks
        () => (tree: Root) => {
          visit(tree, (node: Nodes) => {
            if (node.type === "code") {
              if (!node.lang && this.config.default_lang) {
                // Only insert default lang if it's not already set
                node.lang = this.config.default_lang;
              }
            }
          });
        }
      )
      .use(() => (tree: Root) => {
        // Remove frontmatter node from the tree
        const [frontmatterNode, ...restNodes]: RootContent[] = tree.children;
        if (frontmatterNode.type == "yaml" || frontmatterNode.type == "toml") {
          tree.children = restNodes;
        }
      })
      .use(remarkStringify)
      .process(fs.readFileSync(this.filePath, "utf-8"));
  }

  async getMarkdown(): Promise<string> {
    return this.file.value;
  }

  async getTitle(): Promise<string> {
    return this.file.data.frontmatter[this.config.frontmatterProperties.title];
  }

  async getDescription(): Promise<string> {
    return this.file.data.frontmatter[
      this.config.frontmatterProperties.description
    ];
  }

  async getTags(): Promise<string[]> {
    return this.file.data.frontmatter[this.config.frontmatterProperties.tags];
  }

  async getImage(): Promise<string | undefined> {
    const image =
      this.file.data.frontmatter[this.config.frontmatterProperties.image];
    if (typeof image === "string") {
      return this.config.image_url_base + image;
    }
    if (Array.isArray(image)) {
      return image.map((img) => this.config.image_url_base + img)[0];
    }
    return image;
  }

  async getDate(): Promise<string> {
    return this.file.data.frontmatter[this.config.frontmatterProperties.date];
  }

  async getSlug(): Promise<string> {
    return (
      this.file.data.frontmatter[this.config.frontmatterProperties.slug] ||
      this.getSlugFromFilePath(this.filePath)
    );
  }

  private getSlugFromFilePath(filePath: string): string {
    return filePath.split("/").pop()?.replace(".md", "") || "";
  }
}

export default MarkdownClient;
