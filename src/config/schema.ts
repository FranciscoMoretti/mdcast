import { z } from "zod";

const DevToOptionsSchema = z.object({
  should_publish: z.boolean().default(true),
});

const HashnodeOptionsSchema = z.object({
  should_hide: z.boolean().default(false),
  tagsDictionary: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
      })
    )
    .optional()
    .default([]),
});

const MediumOptionsSchema = z.object({
  should_publish: z.boolean().default(true),
  should_notify_followers: z.boolean().default(false),
  tagsDictionary: z.array(z.string()).optional().default([]),
});

const DevToConfigSchema = z.object({
  connection_settings: z.object({
    api_key: z.string(),
    organization_id: z.string().optional(),
  }),
  options: DevToOptionsSchema,
});

export type DevToConfigSchema = z.infer<typeof DevToConfigSchema>;

const HashnodeConfigSchema = z.object({
  connection_settings: z.object({
    token: z.string(),
    publication_id: z.string().optional(),
  }),
  options: HashnodeOptionsSchema,
});

export type HashnodeConfigSchema = z.infer<typeof HashnodeConfigSchema>;

const MediumConfigSchema = z.object({
  connection_settings: z.object({
    token: z.string(),
    publication_name: z.string().optional(),
  }),
  options: MediumOptionsSchema,
});
export type MediumConfigSchema = z.infer<typeof MediumConfigSchema>;

const FrontMatterPropertiesSchema = z.object({
  title: z.string().optional().default("title"),
  description: z.string().optional().default("description"),
  canonical_url: z.string().optional().default("canonical_url"),
  tags: z.string().optional().default("tags"),
  image: z.string().optional().default("image"),
  date: z.string().optional().default("date"),
  slug: z.string().optional().default("slug"),
});

const MarkdownConfigSchema = z.object({
  frontmatterProperties: FrontMatterPropertiesSchema.optional().default({}),
  link_url_base: z.string().default(""),
  canonical_url_base: z.string().default(""),
  image_url_base: z.string().default(""),
});

export const ConfigSchema = z.object({
  devto: DevToOptionsSchema.default({}),
  hashnode: HashnodeOptionsSchema.default({}),
  medium: MediumOptionsSchema.default({}),
  markdown: MarkdownConfigSchema.default({}),
});

export type MarkdownConfig = z.infer<typeof MarkdownConfigSchema>;

export type MdCastConfig = z.infer<typeof ConfigSchema>;
export type MdCastConfigInput = z.input<typeof ConfigSchema>;
