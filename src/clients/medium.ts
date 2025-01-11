import axios, { AxiosInstance } from "axios";
import { Post } from "../types/post";
import { normalizeTag } from "../utils/normalize-tag";
import { MediumConfigSchema } from "../config/schema";
import { Octokit } from "@octokit/rest";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRemark from "rehype-remark";
import { Element } from "hast";

class MediumClient {
  connection_settings: MediumConfigSchema["connection_settings"];
  options: MediumConfigSchema["options"];
  client: AxiosInstance;
  postData: Post;
  tagsDictionary: Record<string, { slug: string }>;
  private github: Octokit | undefined;
  private tableCounter = 0;
  private dryRun: boolean;
  constructor(config: MediumConfigSchema, postData: Post, dryRun: boolean) {
    this.connection_settings = config.connection_settings;
    this.options = config.options || {};
    this.postData = postData;
    this.dryRun = dryRun;

    this.client = axios.create({
      baseURL: "https://api.medium.com/v1/",
      headers: {
        Authorization: `Bearer ${this.connection_settings.token}`,
      },
    });
    this.tagsDictionary = config.options.tags_dictionary;

    if (this.connection_settings.gist_secret) {
      this.github = new Octokit({
        auth: `token ${this.connection_settings.gist_secret}`,
      });
    }
  }

  private async createGist(content: string) {
    if (!this.github) throw new Error("GitHub client not initialized");

    this.tableCounter++;
    const filename = `table_${this.tableCounter}_${this.postData.slug}.md`;

    // If Dry run, skip this
    if (this.dryRun) return { html_url: "http://example.com" };
    const response = await this.github.gists.create({
      files: {
        [filename]: {
          content,
        },
      },
      description: `Table for ${this.postData.slug} article in Medium`,
      public: true,
    });

    return response.data;
  }

  private async toMediumHtml(markdown: string): Promise<string> {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(() => async (tree) => {
        const nodes: { node: any; index: number; parent: any }[] = [];

        visit(tree, "element", (node, index, parent) => {
          // @ts-expect-error tagname exists in a hast node
          if (node.tagName !== "table" || !parent || typeof index !== "number")
            return;
          nodes.push({ node, index, parent });
        });

        for (const { node, index, parent } of nodes) {
          const tableTree = await unified()
            .use(rehypeRemark)
            .use(remarkGfm)
            .run(node);

          const tableContent = await unified()
            .use(remarkGfm)
            .use(remarkStringify)
            .stringify(tableTree);

          if (this.connection_settings.gist_secret) {
            const gist = await this.createGist(tableContent);
            if (!gist.html_url) throw new Error("Gist not created");

            // Create the script element for gist embedding
            parent.children[index] = {
              type: "element",
              tagName: "script",
              properties: {
                src: `${gist.html_url}.js`,
              },
              children: [],
            };
          } else {
            // Fallback to code block if no gist token
            parent.children[index] = {
              type: "element",
              tagName: "pre",
              properties: {
                "data-code-block-mode": "2",
                "data-code-block-lang": "markdown",
              },
              children: [{ type: "text", value: tableContent.trim() }],
            };
          }
        }
      })
      .use(() => async (tree) => {
        // Transforms code blocks into medium compatible code-blocks
        visit(tree, "element", (node: Element) => {
          if (node.tagName !== "pre") return;

          // Checking if it has children and if children is a code block
          if (!node.children || node.children.length === 0) return;
          const codeNode = node.children[0];
          if (codeNode.type !== "element" || codeNode.tagName !== "code")
            return;

          const className = codeNode.properties["className"];
          let lang = undefined;
          if (className) {
            if (typeof className === "string") {
              lang = className.replace("language-", "");
            } else if (Array.isArray(className)) {
              const firstClassName = className.find(
                (item) => typeof item === "string" && item.includes("language-")
              );
              if (firstClassName && typeof firstClassName === "string") {
                lang = firstClassName.replace("language-", "");
              }
            }
          }
          if (!lang) {
            return;
          }
          node.properties = {
            "data-code-block-mode": "2",
            "data-code-block-lang": lang,
          };

          // Move the text content directly under pre
          // @ts-expect-error value is handled okish-ly for now
          node.children = [{ type: "text", value: codeNode.children[0].value }];
        });
      })
      .use(rehypeStringify)
      .process(markdown);

    return String(file);
  }

  private prepareMediumHml(postData: Post): Promise<string> {
    // Creates nicely formatted markdown for Medium specification
    const { title, description, image, markdown: originalMarkdown } = postData;
    // Include thumbnail image if provided
    const markdown = `# ${title}\r\n\r\n${
      description ? `${description}\r\n\r\n` : ""
    }${image ? `![Post thumbnail](${image})\r\n\r\n` : ""}${originalMarkdown}`;

    // Convert markdown tables
    return this.toMediumHtml(markdown);
  }

  async post() {
    //get post title and add it to the top of the markdown content
    const { title } = this.postData;
    const html = await this.prepareMediumHml(this.postData);

    if (this.dryRun) {
      // TODO: Remove this dry run check. It should happen after communication with Medium API
      console.log("No error occurred while preparing article for Medium.");
      return;
    }

    //get user ID
    const {
      data: {
        data: { id },
      },
    } = await this.client.get("me");

    let requestPath = `users/${id}/posts`;
    if (this.connection_settings.publication_name) {
      //get publication id
      const {
        data: { data },
      } = await this.client.get(`users/${id}/publications`);

      const publication = data.find(
        (pub: Record<string, string>) =>
          pub.name === this.connection_settings.publication_name
      );

      if (publication) {
        requestPath = `publications/${publication.id}/posts`;
      }
    }

    if (this.dryRun) {
      console.log("No error occurred while preparing article for Medium.");
      return;
    }

    await this.client
      .post(requestPath, {
        title,
        contentFormat: "html",
        content: html,
        tags: this.postData.tags
          ? this.postData.tags.map((tag) => this.findTagInDictionary(tag))
          : [],
        canonicalUrl: this.postData.canonical_url || "",
        publishStatus: this.options.should_publish ? "public" : "draft",
        notifyFollowers: this.options.should_notify_followers,
      })
      .catch((error) => console.error(error));

    console.log("Article pushed to Medium");
  }

  private findTagInDictionary(queryTag: string): string {
    // Very simple matching algorithm
    const normalizedQuery = normalizeTag(queryTag);
    const entries = Object.entries(this.tagsDictionary);
    const entry = entries.find(([name]) =>
      normalizeTag(name).includes(normalizedQuery)
    );

    if (entry) {
      const [_, { slug }] = entry;
      return slug;
    }
    throw Error(`Tag ${queryTag} not found in dictionary`);
  }
}

export default MediumClient;
