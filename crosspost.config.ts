import { type CrosspostConfigInput } from "./src/config/schema";

const config: CrosspostConfigInput = {
  markdown: {
    frontmatterProperties: {
      title: "title",
      description: "summary",
      canonical_url: "canonical_url",
      tags: "tags",
      image: "images",
      date: "date",
      slug: "slug",
    },
    relativeUrlBasePath: "https://www.franciscomoretti.com",
    canonical_url_base: "https://www.franciscomoretti.com/blog",
    image_url_base: "https://www.franciscomoretti.com",
  },
  devto: {
    should_publish: true,
  },
  hashnode: {
    should_hide: false,
    // Get tags for hashnode by:
    // 1. Search the tag slug. E.g. Shadcn UI -> shadcn-ui
    // 2. Run the query to get the ID https://gql.hashnode.com/?source=legacy-api-page
    // E.g. query {
    //   tag(slug: "shadcn-ui") {
    //     id
    //   }
    // }
    tagsDictionary: [
      {
        id: "56744721958ef13879b94cad",
        name: "JavaScript",
        slug: "javascript",
      },
      {
        id: "56744723958ef13879b954e0",
        name: "TypeScript",
        slug: "typescript",
      },
      { id: "56744721958ef13879b94988", name: "Ubuntu", slug: "ubuntu" },
      { id: "56744723958ef13879b954f5", name: "UI", slug: "ui" },
      {
        id: "57323a8bae9d49b5a5a5b39c",
        name: "Visual Studio Code",
        slug: "vscode",
      },
      { id: "56744723958ef13879b953f7", name: "Windows", slug: "windows" },
      { id: "56744723958ef13879b95434", name: "React", slug: "reactjs" },
      { id: "5682e64e2c29f7e0c86d024b", name: "services", slug: "services" },
      {
        id: "5f4ebbb150b5c61ec6ef4ad2",
        name: "Tailwind CSS",
        slug: "tailwind-css",
      },
      { id: "56744723958ef13879b9549b", name: "Testing", slug: "testing" },
      { id: "56744721958ef13879b94e0c", name: "tools", slug: "tools" },
      {
        id: "56744723958ef13879b95372",
        name: "debugging",
        slug: "debugging",
      },
      { id: "56744723958ef13879b9526c", name: "Git", slug: "git" },
      { id: "56744722958ef13879b94f96", name: "HTML", slug: "html" },
      { id: "584879f0c0aaf085e2012086", name: "Next.js", slug: "nextjs" },
      {
        id: "56744721958ef13879b94dc4",
        name: "performance",
        slug: "performance",
      },
      {
        id: "56744721958ef13879b9495b",
        name: "analytics",
        slug: "analytics",
      },
      { id: "56744723958ef13879b95245", name: "APIs", slug: "apis" },
      {
        id: "56744723958ef13879b95598",
        name: "best practices",
        slug: "best-practices",
      },
      { id: "56744723958ef13879b953a7", name: "cli", slug: "cli" },
      {
        id: "56744722958ef13879b950eb",
        name: "Databases",
        slug: "databases",
      },
      {
        id: "648b5554f9b78f110ed2c1eb",
        name: "Shadcn UI",
        slug: "shadcn-ui",
      },
    ],
  },
  medium: {
    should_publish: true,
    should_notify_followers: false,
    // Search in https://medium.com/ the tag e.g. "Shadcn UI"
    // When found, get it from the URL
    // E.g. https://medium.com/tag/shadcn-ui -> shadcn-ui
    tagsDictionary: [
      "analytics",
      "api",
      "best-practices",
      "cli",
      "database",
      "debugging",
      "git",
      "html",
      "javaScript",
      "nextjs",
      "performance",
      "react",
      "services",
      "tailwind-Css",
      "testing",
      "tools",
      "typescript",
      "ubuntu",
      "ui",
      "vscode",
      "windows",
      "shadcn-ui",
    ],
  },
};

export default config;
