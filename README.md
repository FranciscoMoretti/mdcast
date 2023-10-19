# md-cross-post

A CLI tool to cross post Markdown articles into Medium, Dev.to and Hashnode.

## References

- [Medium API](https://github.com/Medium/medium-api-docs)
- [Dev.to API](https://developers.forem.com/api)
- [Hashnode API](https://api.hashnode.com/)


### Configuration Instructions

This README provides instructions for configuring API keys and IDs required for publishing articles on different platforms. Please follow the guidelines below to set up the necessary credentials:

#### Dev.to
- **DEVTO_API_KEY (Required):** Your personal Dev.to API key is necessary for authentication. To obtain your API key go to the Settings > Extensions section of your account [here](https://dev.to/settings/extensions).

- **DEVTO_ORG_ID:** The ID of the organization under which you want to publish the article. You can find this ID in two ways:
   1. From the organization dashboard page, where the ID is the last part of the URL. (e.g., `https://dev.to/dashboard/organization/ORG_ID`).
   2. Alternatively, you can use the Dev.to List Organizations endpoint to discover the ID.

#### Hashnode
- **HASHNODE_TOKEN (Required):** Your Hashnode personal token is essential for authentication. Ensure you have this token readily available.

- **HASHNODE_PUB_ID (Required):** The ID of the publication where you wish to publish the article can be found in two ways:
   1. From the publication's dashboard page, where the ID is the second part of the URL (e.g., `https://hashnode.com/PUB_ID/dashboard`).

#### Medium
- **MEDIUM_TOKEN (Required):** The Medium Integration Token is required for authentication. You can obtain this token by following [this link](https://medium.com/me/settings/security).

- **MEDIUM_PUB_NAME:** Specify the exact name of the Medium publication where you want to publish the article. Make sure it matches the publication name on Medium.

Please ensure you have the required credentials and follow the respective links provided to retrieve them.