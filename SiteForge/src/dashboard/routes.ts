import { Router, Request, Response } from 'express';
import { getScrapeStatus } from './scrape-status';
import { scrapeQueueEvents } from '../jobs/queue';
import { SourceType } from '../jobs/queue';
import { startBusinessScrape } from '../jobs/producers';
import { getPreviewStats } from '../preview/analytics/stats';
import { getPreviewAnalytics } from '../preview/analytics/tracker';
import { composeEmailPreview, sendPreviewEmail } from '../preview/email/composer';
import { getPreviewLink } from '../preview/links/manager';
import { pool } from '../database/pool';

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

router.post('/scrape/start', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId;
  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { businessId, name, address, url } = req.body;
  if (!businessId || !name || !address) {
    return res.status(400).json({ error: 'Missing required fields: businessId, name, address' });
  }

  try {
    const flow = await startBusinessScrape({
      businessId,
      tenantId,
      name,
      address,
      url: url || '',
    });
    res.status(202).json({ status: 'accepted', flowId: (flow as any).id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start scrape', details: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/previews - List all preview links for tenant
router.get('/previews', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await pool.query(
    `SELECT pl.id, pl.url_hash, pl.business_id, pl.status, pl.expires_at, pl.view_count, pl.viewed_at, pl.created_at,
            b.name as business_name
     FROM preview_links pl
     JOIN businesses b ON b.id = pl.business_id
     WHERE pl.tenant_id = $1
     ORDER BY pl.created_at DESC`,
    [tenantId]
  );

  res.json({
    previews: result.rows.map(row => ({
      id: row.id,
      businessName: row.business_name,
      previewUrl: `https://biz-${row.url_hash}.preview.siteforge.io`,
      status: row.status,
      views: parseInt(row.view_count, 10),
      firstViewedAt: row.viewed_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })),
  });
});

// GET /api/previews/:hash - Get single preview with full stats
router.get('/previews/:hash', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;
  const { hash } = req.params;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const stats = await getPreviewStats(hash, tenantId);
  if (!stats) {
    return res.status(404).json({ error: 'Preview not found' });
  }

  res.json(stats);
});

// GET /api/previews/:hash/analytics - Get detailed analytics for a preview
router.get('/previews/:hash/analytics', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;
  const { hash } = req.params;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const preview = await getPreviewLink(hash);
  if (!preview || preview.tenantId !== tenantId) {
    return res.status(404).json({ error: 'Preview not found' });
  }

  const analytics = await getPreviewAnalytics(preview.id, tenantId);
  res.json(analytics);
});

// POST /api/previews/:hash/email - Generate and optionally send email for preview
router.post('/previews/:hash/email', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;
  const { hash } = req.params;
  const { toEmail, ownerName, send } = req.body;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const preview = await getPreviewLink(hash);
  if (!preview || preview.tenantId !== tenantId) {
    return res.status(404).json({ error: 'Preview not found' });
  }

  // Fetch business name for personalization
  const businessResult = await pool.query(
    `SELECT name FROM businesses WHERE id = $1`,
    [preview.businessId]
  );
  const businessName = businessResult.rows[0]?.name ?? 'Business';

  const emailResult = await composeEmailPreview({
    tenantId,
    businessId: preview.businessId,
    businessName,
    previewUrl: `https://biz-${hash}.preview.siteforge.io`,
    agentName: (req as any).user?.name ?? 'Your Agent',
    agentEmail: (req as any).user?.email ?? 'agent@siteforge.io',
    toEmail,
    ownerName,
  });

  if (send === true) {
    // Actually send the email
    const sendResult = await sendPreviewEmail({
      tenantId,
      businessId: preview.businessId,
      businessName,
      previewUrl: `https://biz-${hash}.preview.siteforge.io`,
      agentName: (req as any).user?.name ?? 'Your Agent',
      agentEmail: (req as any).user?.email ?? 'agent@siteforge.io',
      toEmail,
      ownerName,
    });

    res.json({ ...emailResult, sent: sendResult.success });
  } else {
    res.json({ ...emailResult, sent: false });
  }
});

// POST /api/previews/:hash/refresh - Regenerate preview (re-run Astro build)
router.post('/previews/:hash/refresh', async (req: Request, res: Response) => {
  const tenantId = (req as any).tenantId as string;
  const { hash } = req.params;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const preview = await getPreviewLink(hash);
  if (!preview || preview.tenantId !== tenantId) {
    return res.status(404).json({ error: 'Preview not found' });
  }

  // TODO: Trigger preview regeneration via BullMQ job
  res.json({ message: 'Preview regeneration queued' });
});

export default router;
