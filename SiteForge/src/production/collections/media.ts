import { CollectionConfig } from 'payload';

export const media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
    },
    {
      name: 'mimeType',
      type: 'text',
      required: true,
    },
    {
      name: 's3Key',
      type: 'text',
      required: true,
    },
    {
      name: 'size',
      type: 'number',
      required: true,
    },
    {
      name: 'width',
      type: 'number',
    },
    {
      name: 'height',
      type: 'number',
    },
  ],
};
