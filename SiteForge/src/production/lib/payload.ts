import { Payload } from 'payload';
import { payloadConfig } from '../payload.config';

let cachedPayload: Payload | null = null;

export async function getPayload(): Promise<Payload> {
  if (cachedPayload) {
    return cachedPayload;
  }

  cachedPayload = await Payload.init({
    config: payloadConfig,
  });

  return cachedPayload;
}
