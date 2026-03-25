import { CollectionConfig } from 'payload';
import { payloadPages, payloadMedia, payloadSiteSettings, ownerAccounts, feedbackAnnotations } from '../../database/schema';

export const PagesCollection: CollectionConfig = {
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
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      required: true,
    },
    // Tenant isolation fields (managed via middleware, not exposed to Payload)
    {
      name: 'tenantId',
      type: 'text',
      hidden: true,
    },
    {
      name: 'businessId',
      type: 'text',
      hidden: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Set publishedAt when publishing
        if (operation === 'update' && data.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString();
        }
        return data;
      },
    ],
    afterChange: [
      ({ doc, operation }) => {
        // Trigger revalidation on publish
        if (operation === 'update' && doc.status === 'published') {
          // Import dynamically to avoid circular deps
          import('../cdn/revalidator').then(({ revalidatePage }) => {
            revalidatePage(doc.slug);
          });
        }
        return doc;
      },
    ],
  },
};

export const MediaCollection: CollectionConfig = {
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
    {
      name: 'tenantId',
      type: 'text',
      hidden: true,
    },
    {
      name: 'businessId',
      type: 'text',
      hidden: true,
    },
  ],
};

export const SiteSettingsCollection: CollectionConfig = {
  slug: 'site-settings',
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
      type: 'email',
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
    {
      name: 'tenantId',
      type: 'text',
      hidden: true,
      unique: true,
    },
    {
      name: 'businessId',
      type: 'text',
      hidden: true,
    },
  ],
};

export const UsersCollection: CollectionConfig = {
  slug: 'users',
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      options: ['owner', 'dev-team', 'admin'],
      required: true,
    },
    {
      name: 'tenantId',
      type: 'text',
      hidden: true,
    },
    {
      name: 'businessId',
      type: 'text',
      hidden: true,
    },
  ],
};
