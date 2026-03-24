import { flowProducer } from '../../jobs/queue';
import { QUEUE_NAMES } from '../../jobs/queue';
import { AIPipelineJob, ImageSelectJob, CopyWriteJob } from './types';

/**
 * Create AI pipeline flow.
 *
 * Flow structure:
 * - Parent: ai-pipeline (waits for children)
 * - Child 1: image-select (engagement scoring + quality filter + AI classification)
 * - Child 2: copy-write (copy generation + testimonial selection)
 *
 * Children run in parallel for speed (per user decision).
 */
export async function createAIPipelineFlow(jobData: AIPipelineJob) {
  const flow = await flowProducer.add({
    name: 'ai-pipeline',
    queueName: QUEUE_NAMES.GENERATION,
    data: {
      businessId: jobData.businessId,
      tenantId: jobData.tenantId,
    } satisfies AIPipelineJob,
    children: [
      {
        name: 'image-select',
        queueName: QUEUE_NAMES.GENERATION,
        data: {
          businessId: jobData.businessId,
          tenantId: jobData.tenantId,
        } satisfies ImageSelectJob,
      },
      {
        name: 'copy-write',
        queueName: QUEUE_NAMES.GENERATION,
        data: {
          businessId: jobData.businessId,
          tenantId: jobData.tenantId,
        } satisfies CopyWriteJob,
      },
    ],
  });

  return flow;
}
