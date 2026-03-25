import { getPayload } from 'payload';
import { payloadConfig } from '../payload.config';

// Cache payload instance
let payloadInstance: Awaited<ReturnType<typeof getPayload>> | null = null;

export const getPayloadInstance = async () => {
  if (!payloadInstance) {
    payloadInstance = await getPayload({ config: payloadConfig });
  }
  return payloadInstance;
};

// For use in server components
export const getPayloadSingleton = async () => getPayloadInstance();
