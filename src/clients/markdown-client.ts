import { NotionOptions } from "../types/clients/notion";
import { ConfigNotion } from "../types/config";
import fs from "fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkParseFrontmatter from "remark-parse-frontmatter";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { Literal, Nodes, Root, RootContent } from "mdast";

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

class Markdown {
  options: NotionOptions;
  filePath: string;
  file: any;

  constructor(config: ConfigNotion, filePath: string) {
    this.filePath = filePath;
    this.options = config.options;

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
        (
            options = {
              search: /^/,
              replace: "/uploads",
            }
          ) =>
          (tree: Root) => {
            visit(tree, (node: Nodes) => {
              if (node.type === "image") {
                node.url = normalizeObsidianAbsolutePath(node.url);
                node.url = node.url.replace(options.search, options.replace);
              }
            });
          },
        {
          search: /^\/([^\s]+)/gm,
          replace: "https://www.franciscomoretti.com/$1",
        }
      )
      .use(
        // Replace local links with site url
        () => (tree: Root) => {
          visit(tree, (node: Nodes) => {
            if (node.type === "link") {
              let url = node.url;
              url = normalizeObsidianAbsolutePath(url);
              if (url.startsWith("/")) {
                url = removeFileExtension(url);
                // TODO provide internal links base URL as an config option
                url = "https://www.franciscomoretti.com" + url;
              }
              node.url = url;
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
    return this.file.data.frontmatter.title;
  }

  async getDescription(): Promise<string> {
    return this.file.data.frontmatter.description;
  }

  async getTags(): Promise<string> {
    return this.file.data.frontmatter.tag;
  }

  async getImage(): Promise<string> {
    return this.file.data.frontmatter.image;
  }

  async getDate(): Promise<string> {
    return this.file.data.frontmatter.date;
  }

  async getSlug(): Promise<string> {
    return this.file.data.frontmatter.slug;
  }
}

export default Markdown;
