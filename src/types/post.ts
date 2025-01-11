export interface Post {
  title: string;
  description?: string;
  image?: string;
  markdown: string;
  tags?: string[];
  canonical_url?: string;
  slug: string;
}
