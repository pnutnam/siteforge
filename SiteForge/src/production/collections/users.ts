import { CollectionConfig } from 'payload';

export const users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'editor', 'owner'],
      defaultValue: 'owner',
    },
  ],
};
