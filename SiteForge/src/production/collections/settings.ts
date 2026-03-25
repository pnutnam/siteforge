import { CollectionConfig } from 'payload';

export const settings: CollectionConfig = {
  slug: 'settings',
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'contactEmail',
      type: 'text',
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      name: 'address',
      type: 'text',
    },
    {
      name: 'socialLinks',
      type: 'json',
      defaultValue: {},
    },
  ],
};
