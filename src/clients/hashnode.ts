import { GraphQLClient, gql } from "graphql-request";
import {
  HashnodeConnectionSettings,
  HashnodeOptions,
  HashnodeProperties,
} from "../types/clients/hashnode";
import { ConfigHashnode } from "../types/config";
import { Post } from "../types/post";
import fs from "fs";
import { normalizeTag } from "../utils/normalize-tag";

type HashnodeTag = {
  _id: string;
  slug: string;
  name: string;
};

const TAGS_DICTIONARY_FILENAME = "hashnode-tags-dictionary.json";
class HashnodeClient {
  connection_settings: HashnodeConnectionSettings;
  options: HashnodeOptions;
  client: GraphQLClient;
  postData: Post;
  tagsDictionary: HashnodeTag[];

  constructor(config: ConfigHashnode, postData: Post) {
    this.connection_settings = config.connection_settings;
    this.options = config.options || {};
    this.postData = postData;
    this.client = new GraphQLClient("https://api.hashnode.com", {
      headers: {
        authorization: this.connection_settings.token,
      },
    });
    this.tagsDictionary = this.loadFromFile();
  }

  async createDictionary(username: string) {
    // TODO move username to ENV variable
    const userPosts = await this.getPublicationPosts("franciscomoretti");

    const tagsArticlesPosts = userPosts.filter((post) =>
      post.slug.startsWith("tags-article")
    );
    const tagsPromises = tagsArticlesPosts.map((post) =>
      this.getTagsFromPost(`${post.slug}-${post.cuid}`)
    );
    const postsTags = await Promise.all(tagsPromises);
    const tags = postsTags.flatMap((tag) => tag);
    this.saveToFile(tags);
    console.log("Tags Dictionary written correctly");
  }

  private saveToFile(tags: HashnodeTag[]) {
    const jsonData = JSON.stringify(tags);

    fs.writeFile(TAGS_DICTIONARY_FILENAME, jsonData, (error) => {
      // throwing the error
      // in case of a writing problem
      if (error) {
        // logging the error
        console.error(error);

        throw error;
      }
    });
  }

  private loadFromFile() {
    let dictionary = [];
    try {
      const data = fs.readFileSync(TAGS_DICTIONARY_FILENAME, "utf8");
      dictionary = JSON.parse(data);
    } catch (error) {
      console.error(error);
      throw error;
    }

    return dictionary;
  }

  private findTagInDictionary(queryTag: string): HashnodeTag {
    // Very simple matching algorithm
    const normalizedQuery = normalizeTag(queryTag);
    const tag = this.tagsDictionary.find((tag) =>
      normalizeTag(tag.slug).includes(normalizedQuery)
    );
    if (tag) {
      return tag;
    }
    throw Error(`Tag ${queryTag} not found in dictionary`);
  }

  async post(dryRun?: boolean) {
    //get tags
    let hashNodeTags: HashnodeTag[] = [];
    const inputTags = this.postData.tags;
    if (inputTags) {
      const foundTags = inputTags
        .split(",")
        .map((tag) => this.findTagInDictionary(tag));

      hashNodeTags = foundTags;
    }

    const createStoryInput = {
      title: this.postData.title,
      contentMarkdown: this.postData.markdown,
      // Use description as subtitle if they are 150 chars
      ...(this.postData.description && {
        subtitle: this.postData.description,
      }),
      ...(this.postData.canonical_url && {
        isRepublished: {
          originalArticleURL: this.postData.canonical_url,
        },
      }),
      ...(this.postData.image && {
        coverImageURL: this.postData.image,
      }),
      tags: hashNodeTags,
      isPartOfPublication: {
        publicationId: this.connection_settings.publication_id,
      },
    };

    //post to personal
    const mutation = gql`
      mutation createPublicationStory(
        $input: CreateStoryInput!
        $publicationId: String!
        $hideFromHashnodeFeed: Boolean!
      ) {
        createPublicationStory(
          input: $input
          publicationId: $publicationId
          hideFromHashnodeFeed: $hideFromHashnodeFeed
        ) {
          success
          message
        }
      }
    `;

    const data = {
      input: createStoryInput,
      publicationId: this.connection_settings.publication_id,
      hideFromHashnodeFeed: this.options.should_hide,
    };

    if (dryRun) {
      console.log("No error occurred while preparing article for Hashnode.");
      return;
    }

    await this.client.request(mutation, data);

    console.log("Article pushed to Hashnode");
  }

  async getPublicationPosts(
    username: string
  ): Promise<{ _id: string; cuid: string; title: string; slug: string }[]> {
    //retrieve all posts from user
    const data = {
      username: username,
    };

    const query = gql`
      query PublicationQuery($username: String!) {
        user(username: $username) {
          publication {
            posts(page: 0) {
              _id
              cuid
              title
              slug
            }
          }
        }
      }
    `;
    const response: any = await this.client.request(query, data);
    return response.user.publication.posts;
  }

  async getTagsFromPost(slug: string): Promise<HashnodeTag[]> {
    //retrieve all tags from a post
    const data = {
      slug: slug,
      hostname: "",
    };

    const query = gql`
      query PostQuery($slug: String!, $hostname: String) {
        post(slug: $slug, hostname: $hostname) {
          tags {
            _id
            name
            slug
          }
        }
      }
    `;
    const response: any = await this.client.request(query, data);
    return response.post.tags;
  }
}

export default HashnodeClient;
