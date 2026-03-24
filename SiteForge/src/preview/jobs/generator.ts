/**
 * BullMQ job to generate a preview landing page.
 * Triggered after AI pipeline completes for a business.
 */

import { BuildOptions, buildPreview } from '../builder';

export interface PreviewGeneratorJob {
  businessId: string;
  tenantId: string;
  astroProjectPath: string;
}

export async function processPreviewGenerator(job: PreviewGeneratorJob): Promise<{
  previewUrl: string;
  s3Key: string;
  buildTimeMs: number;
}> {
  console.log(`[PreviewGenerator] Building preview for business ${job.businessId}`);

  const result = await buildPreview({
    businessId: job.businessId,
    tenantId: job.tenantId,
    astroProjectPath: job.astroProjectPath,
    tempDir: `/tmp/preview-build-${job.businessId}`,
  });

  console.log(`[PreviewGenerator] Preview ready: ${result.previewUrl} (${result.buildTimeMs}ms)`);

  return result;
}
