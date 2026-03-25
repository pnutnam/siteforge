import { buildConfig } from 'payload';
import { PagesCollection, MediaCollection, SiteSettingsCollection, UsersCollection } from './collections/index';

export const payloadConfig = buildConfig({
  collections: [PagesCollection, MediaCollection, SiteSettingsCollection, UsersCollection],
  telemetry: false,
  secret: process.env.PAYLOAD_SECRET || 'development-secret-change-in-production',
});
