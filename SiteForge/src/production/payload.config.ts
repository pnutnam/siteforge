import { buildConfig } from 'payload';
import { pages } from './collections/pages';
import { media } from './collections/media';
import { settings } from './collections/settings';
import { users } from './collections/users';

export const payloadConfig = buildConfig({
  collections: [pages, media, settings, users],
  telemetry: false,
  secret: process.env.PAYLOAD_SECRET || 'development-secret-change-in-production',
});
