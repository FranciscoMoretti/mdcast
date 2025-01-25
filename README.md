# mdcast

A CLI tool to cross post Markdown articles into Medium, Dev.to and Hashnode.

## Installation

```bash
npm install mdcast
```

## Usage

### 1. Initialize Configuration

First, initialize your project configuration:

```bash
mdcast init
```

This will create a `mdcast.config.json` file in your current directory with default settings.

### 2. Set Environment Variables

Create a `.env` file with your API keys (see Configuration Instructions below for details):

```env
# Required for Dev.to
DEVTO_API_KEY=your_api_key
DEVTO_ORG_ID=optional_org_id

# Required for Hashnode
HASHNODE_TOKEN=your_token
HASHNODE_PUB_ID=optional_pub_id

# Required for Medium
MEDIUM_TOKEN=your_token
MEDIUM_PUBLICATION_NAME=optional_pub_name
```

### 3. Post Your Content

To post your markdown content:

```bash
mdcast post path/to/your/article.md --platforms devto,medium,hashnode
```

Options:

- `--platforms`: Comma-separated list of platforms to post to (`devto`, `medium`, `hashnode`)
- `--dry-run`: Test the posting process without actually publishing

## Configuration

You can customize your posting preferences in `mdcast.config.json`:

```json
{
  "devto": {
    "should_publish": true
  },
  "hashnode": {
    "should_hide": false,
    "tags_dictionary": {}
  },
  "medium": {
    "should_publish": true,
    "should_notify_followers": false,
    "tags_dictionary": {}
  },
  "markdown": {
    "frontmatterProperties": {
      "title": "title",
      "description": "description",
      "canonical_url": "canonical_url",
      "tags": "tags",
      "image": "image",
      "date": "date",
      "slug": "slug"
    },
    "link_url_base": "",
    "canonical_url_base": "",
    "image_url_base": ""
  }
}
```

## References

- [Medium API](https://github.com/Medium/medium-api-docs)
- [Dev.to API](https://developers.forem.com/api)
- [Hashnode API](https://api.hashnode.com/)

### Configuration Instructions

This README provides instructions for configuring API keys and IDs required for publishing articles on different platforms. Please follow the guidelines below to set up the necessary credentials:

#### Dev.to

- **DEVTO_API_KEY (Required):** Your personal Dev.to API key is necessary for authentication. To obtain your API key go to the Settings > Extensions section of your account [here](https://dev.to/settings/extensions).

- **DEVTO_ORG_ID (Optional):** The ID of the organization under which you want to publish the article. You can find this ID in two ways:
  1.  From the organization dashboard page, where the ID is the last part of the URL. (e.g., `https://dev.to/dashboard/organization/ORG_ID`).
  2.  Alternatively, you can use the Dev.to List Organizations endpoint to discover the ID.

#### Dev.to sanitized gifs (Optional)

Dev.to has a file size limit for GIF uploads. To work around this, you can upload your GIFs to Giphy first and use the Giphy URL in your posts instead.

- **GIPHY_API_KEY_DEVTO_GIFS (Optional):** The Giphy API key is required for uploading GIFs to Giphy. You can obtain this key by following [this link](https://developers.giphy.com/dashboard/).

#### Hashnode

- **HASHNODE_TOKEN (Required):** Your Hashnode personal token is essential for authentication. Ensure you have this token readily available.

- **HASHNODE_PUB_ID (Optional):** The ID of the publication where you wish to publish the article can be found in publication's dashboard page, where the ID is the second part of the URL (e.g., `https://hashnode.com/PUB_ID/dashboard`).

### Medium

- **MEDIUM_TOKEN (Required):** The Medium Integration Token is required for authentication. You can obtain this token by following [this link](https://medium.com/me/settings/security).

- **MEDIUM_PUBLICATION_NAME (Optional):** Specify the exact name of the Medium publication where you want to publish the article. Make sure it matches the publication name on Medium.

Please ensure you have the required credentials and follow the respective links provided to retrieve them.

#### Medium Tables with nice formatting (Optional)

Medium does not support tables in markdown, so we need to use a gist to save the table content. GitHub gists provide a nice markdown table formatting. If not provided, the table will be saved as a markdown codeblock.

- **GITHUB_TOKEN_MEDIUM_TABLES (Optional):** The GitHub token is required for the Medium client to create a gist and save the table content as a markdown file. You can obtain this token by following [this link](https://github.com/settings/tokens).

You'll need to:

1. Create a GitHub Personal Access Token (PAT) with gist scope at https://github.com/settings/tokens
2. Add it to your .env file as GITHUB_TOKEN_MEDIUM_TABLES or similar

## Tags Configuration

Each platform requires specific tag formats. You can configure tag mappings in your `mdcast.config.json` under the `tags_dictionary` field for each platform:

### Hashnode Tags

To get tag IDs for Hashnode:

1. Find the tag slug (e.g., "Shadcn UI" -> "shadcn-ui")
2. Query the Hashnode GraphQL API at https://gql.hashnode.com:
   ```graphql
   query {
     tag(slug: "shadcn-ui") {
       id
     }
   }
   ```
3. Add to config:
   ```json
   "hashnode": {
     "tags_dictionary": {
       "Shadcn UI": {
         "slug": "shadcn-ui",
         "id": "648b5554f9b78f110ed2c1eb"
       }
     }
   }
   ```

### Medium Tags

To get tag slugs for Medium:

1. Search for the tag on Medium (e.g., "Shadcn UI")
2. Get the slug from the URL: `https://medium.com/tag/shadcn-ui` -> `shadcn-ui`
3. Add to config:
   ```json
   "medium": {
     "tags_dictionary": {
       "Shadcn UI": {
         "slug": "shadcn-ui"
       }
     }
   }
   ```
