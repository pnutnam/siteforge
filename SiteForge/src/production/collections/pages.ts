import { CollectionConfig } from 'payload';

export const pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Untitled',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'content',
      type: 'json',
      required: true,
      defaultValue: {},
    },
    {
      name: 'templateId',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
  ],
};
