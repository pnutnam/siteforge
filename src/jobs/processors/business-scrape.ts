import { Job } from 'bullmq';
import { BusinessScrapeJob } from '../queue';
import { initScrapeStatus, updateBusinessStatus } from '../../dashboard/scrape-status';

export async function processBusinessScrape(job: Job<BusinessScrapeJob>) {
  const { businessId, tenantId, name, address } = job.data;

  const sources = ['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'];
  initScrapeStatus(businessId, tenantId, sources as any[]);

  const childResults: Map<string, 'completed' | 'failed'> = new Map();
  const totalChildren = sources.length;

  updateBusinessStatus(businessId, tenantId, { status: 'in_progress' });

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Parent job timeout waiting for children'));
    }, 30 * 60 * 1000);

    function cleanup() {
      clearTimeout(timeout);
    }

    let checkInterval: NodeJS.Timeout;

    async function checkCompletion() {
      const allDone = childResults.size === totalChildren;
      const anyFailed = Array.from(childResults.values()).some(v => v === 'failed');
      const allSucceeded = Array.from(childResults.values()).every(v => v === 'completed');

      if (allDone) {
        cleanup();
        const finalStatus = anyFailed ? (allSucceeded ? 'completed' : 'partial') : 'completed';
        updateBusinessStatus(businessId, tenantId, {
          status: finalStatus,
          completedAt: new Date(),
        });
        resolve();
      }
    }

    checkInterval = setInterval(checkCompletion, 1000);
  });
}
