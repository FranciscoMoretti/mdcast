import { GraphQLClient, gql } from "graphql-request";

import { Post } from "../types/post";
import { normalizeTag } from "../utils/normalize-tag";
import { HashnodeConfigSchema } from "../config/schema";

type HashnodeTag = {
  id: string;
  slug: string;
  name: string;
};

class HashnodeClient {
  connection_settings: HashnodeConfigSchema["connection_settings"];
  options: HashnodeConfigSchema["options"];
  client: GraphQLClient;
  postData: Post;
  tagsDictionary: HashnodeTag[];

  constructor(config: HashnodeConfigSchema, postData: Post) {
    this.connection_settings = config.connection_settings;
    this.options = config.options || {};
    this.postData = postData;
    this.client = new GraphQLClient("https://gql.hashnode.com", {
      headers: {
        authorization: this.connection_settings.token,
      },
    });
    this.tagsDictionary = config.options.tagsDictionary;
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

    if (dryRun) {
      console.log("No error occurred while preparing article for Hashnode.");
      return;
    }

    const post = await this.client
      .request(mutation, data)
      .catch((err) => console.error(err));

    // TODO: Get the address from post
    console.log("Article pushed to Hashnode");
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
