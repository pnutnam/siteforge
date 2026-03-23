import { Router, Request, Response } from 'express';
import { getScrapeStatus } from './scrape-status';
import { scrapeQueueEvents } from '../jobs/queue';
import { SourceType } from '../jobs/queue';

const router = Router();

router.get('/scrape/status/:businessId', async (req: Request, res: Response) => {
  const businessId = req.params.businessId as string;
  const tenantId = (req as any).tenantId as string;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const status = getScrapeStatus(businessId, tenantId);

  if (!status) {
    return res.status(404).json({ error: 'Scrape status not found' });
  }

  res.json(status);
});

router.get('/scrape/status/:businessId/stream', async (req: Request, res: Response) => {
  const businessId = req.params.businessId as string;
  const tenantId = (req as any).tenantId as string;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const initialStatus = getScrapeStatus(businessId, tenantId);
  if (initialStatus) {
    res.write(`data: ${JSON.stringify(initialStatus)}\n\n`);
  }

  const completedHandler = (data: { jobId: string; name?: string }) => {
    const source = data.name as SourceType;
    if (['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'].includes(source)) {
      const status = getScrapeStatus(businessId, tenantId);
      if (status) {
        res.write(`data: ${JSON.stringify(status)}\n\n`);
      }
    }
  };

  const failedHandler = (data: { jobId: string; name?: string; failedReason?: string }) => {
    const source = data.name as SourceType;
    if (['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'].includes(source)) {
      const status = getScrapeStatus(businessId, tenantId);
      if (status) {
        res.write(`data: ${JSON.stringify(status)}\n\n`);
      }
    }
  };

  scrapeQueueEvents.on('completed', completedHandler);
  scrapeQueueEvents.on('failed', failedHandler);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    scrapeQueueEvents.off('completed', completedHandler);
    scrapeQueueEvents.off('failed', failedHandler);
  });
});

export default router;
