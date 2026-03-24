/**
 * AI Pipeline integration helpers.
 */

import { createAIPipelineFlow } from './orchestrator';
import { AIPipelineJob } from './types';

/**
 * Trigger AI pipeline after scrape completion.
 * Called from scrape completion handler.
 */
export async function triggerAIPipeline(businessId: string, tenantId: string) {
  const jobData: AIPipelineJob = {
    businessId,
    tenantId,
  };

  return createAIPipelineFlow(jobData);
}
