import { GraphQLClient, gql } from "graphql-request";

import { Post } from "../types/post";
import { normalizeTag } from "../utils/normalize-tag";
import { HashnodeConfigSchema } from "../config/schema";

type HashnodeTag = {
  id: string;
  slug: string;
  name: string;
};

type PostResponse = {
  publishPost: {
    post: {
      id: string;
      slug: string;
      title: string;
      subtitle?: string;
      brief: string;
      url: string;
      canonicalUrl?: string;
      publishedAt: string;
      updatedAt?: string;
      readTimeInMinutes: number;
      views: number;
      reactionCount: number;
      responseCount: number;
      featured: boolean;
      bookmarked: boolean;
      coverImage?: {
        url: string;
      };
      tags?: {
        id: string;
        name: string;
        slug: string;
      }[];
    };
  };
};

type HashnodeTagDictionary = Record<string, { slug: string; id: string }>;

class HashnodeClient {
  connection_settings: HashnodeConfigSchema["connection_settings"];
  options: HashnodeConfigSchema["options"];
  client: GraphQLClient;
  postData: Post;
  tagsDictionary: HashnodeTagDictionary;
  dryRun: boolean;

  constructor(config: HashnodeConfigSchema, postData: Post, dryRun: boolean) {
    this.connection_settings = config.connection_settings;
    this.options = config.options || {};
    this.postData = postData;
    this.dryRun = dryRun;
    this.client = new GraphQLClient("https://gql.hashnode.com", {
      headers: {
        authorization: this.connection_settings.token,
      },
    });
    this.tagsDictionary = config.options.tags_dictionary;
  }

  // async createDictionary(username: string) {
  //   // TODO move username to ENV variable
  //   const userPosts = await this.getPublicationPosts("franciscomoretti");

  //   const tagsArticlesPosts = userPosts.filter((post) =>
  //     post.slug.startsWith("tags-article")
  //   );
  //   const tagsPromises = tagsArticlesPosts.map((post) =>
  //     this.getTagsFromPost(`${post.slug}-${post.cuid}`)
  //   );
  //   const postsTags = await Promise.all(tagsPromises);
  //   const tags = postsTags.flatMap((tag) => tag);
  //   this.saveToFile(tags);
  //   console.log("Tags Dictionary written correctly");
  // }

  // private saveToFile(tags: HashnodeTag[]) {
  //   const jsonData = JSON.stringify(tags);

  //   fs.writeFile(TAGS_DICTIONARY_FILENAME, jsonData, (error) => {
  //     // throwing the error
  //     // in case of a writing problem
  //     if (error) {
  //       // logging the error
  //       console.error(error);

  //       throw error;
  //     }
  //   });
  // }

  private findTagInDictionary(queryTag: string): HashnodeTag {
    // Very simple matching algorithm
    const normalizedQuery = normalizeTag(queryTag);
    const entries = Object.entries(this.tagsDictionary);
    const entry = entries.find(([name]) =>
      normalizeTag(name).includes(normalizedQuery)
    );

    if (entry) {
      const [name, { slug, id }] = entry;
      return { name, slug, id };
    }
    throw Error(`Tag ${queryTag} not found in dictionary`);
  }

  async post() {
    //get tags
    let hashNodeTags: HashnodeTag[] = [];
    const inputTags = this.postData.tags;
    if (inputTags) {
      const foundTags = inputTags.map((tag) => this.findTagInDictionary(tag));

      hashNodeTags = foundTags;
    }

    const publishPostInput = {
      title: this.postData.title,
      contentMarkdown: this.postData.markdown,
      // Use description as subtitle if they are 150 chars
      ...(this.postData.description && {
        subtitle: this.postData.description,
      }),
      ...(this.postData.canonical_url && {
        originalArticleURL: this.postData.canonical_url,
      }),
      // TODO: Modify image
      ...(this.postData.image && {
        coverImageOptions: {
          coverImageURL: this.postData.image,
        },
      }),
      tags: hashNodeTags,
      publicationId: this.connection_settings.publication_id,
    };

    //post to personal
    const mutation = gql`
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post {
            slug
          }
        }
      }
    `;

    const data = {
      input: publishPostInput,
    };

    if (this.dryRun) {
      console.log("No error occurred while preparing article for Hashnode.");
      return;
    }

    try {
      const post = await this.client.request<PostResponse>(mutation, data);

      if (!post || !post.publishPost) {
        throw new Error("Failed to publish post - no response data");
      }

      console.log(
        `Article published to Hashnode with slug: ${post.publishPost.post.slug}`
      );
      return post.publishPost.post.slug;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to publish to Hashnode:", errorMessage);

      if (error instanceof Error && "response" in error) {
        // GraphQL errors typically come in response.errors
        const gqlError = error as any;
        if (gqlError.response?.errors) {
          console.error("GraphQL Errors:", gqlError.response.errors);
        }
      }

      throw error; // Re-throw to let caller handle
    }
  }

  async getPublicationPosts(
    username: string
  ): Promise<{ id: string; cuid: string; title: string; slug: string }[]> {
    //retrieve all posts from user
    const data = {
      username: username,
    };

    const query = gql`
      query PublicationQuery($username: String!) {
        user(username: $username) {
          publication {
            posts(page: 0) {
              id
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
