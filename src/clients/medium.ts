import axios, { AxiosInstance } from "axios";
import { Post } from "../types/post";
import { normalizeTag } from "../utils/normalize-tag";
import { MediumConfigSchema } from "../config/schema";

class MediumClient {
  connection_settings: MediumConfigSchema["connection_settings"];
  options: MediumConfigSchema["options"];
  client: AxiosInstance;
  postData: Post;
  tagsDictionary: string[];

  constructor(config: MediumConfigSchema, postData: Post) {
    this.connection_settings = config.connection_settings;
    this.options = config.options || {};
    this.postData = postData;

    this.client = axios.create({
      baseURL: "https://api.medium.com/v1/",
      headers: {
        Authorization: `Bearer ${this.connection_settings.token}`,
      },
    });
    this.tagsDictionary = config.options.tagsDictionary;
  }

  async post(dryRun?: boolean) {
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

    //get post title and add it to the top of the markdown content
    const { title } = this.postData;
    const subtitle = this.postData.description;
    const { image } = this.postData;
    const markdown = `# ${title}\r\n\r\n${
      subtitle ? `${subtitle}\r\n\r\n` : ""
    }${image ? `![Post thumbnail](${image})\r\n\r\n` : ""}${
      this.postData.markdown
    }`;

    if (dryRun) {
      console.log("No error occurred while preparing article for Medium.");
      return;
    }

    await this.client
      .post(requestPath, {
        title,
        contentFormat: "markdown",
        content: markdown,
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
    const tag = this.tagsDictionary.find((tag) =>
      normalizeTag(tag).includes(normalizedQuery)
    );
    if (tag) {
      return tag;
    }
    throw Error(`Tag ${queryTag} not found in dictionary`);
  }
}

export default MediumClient;
