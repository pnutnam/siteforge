import express from 'express';
import { scrapeQueue } from './jobs/queue';
import { processBusinessScrape, processSourceScrape } from './jobs/processors';
import { Worker } from 'bullmq';
import { tenantMiddleware } from './database/tenant-middleware';
import dashboardRouter from './dashboard/routes';
const businessWorker = new Worker(
  'scrape',
  async (job) => {
    if (job.name === 'scrape-business') {
      return processBusinessScrape(job);
    } else {
      return processSourceScrape(job);
    }
  },
  {
    connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    concurrency: 5,
  }
);

const app = express();
app.use(express.json());

app.use(tenantMiddleware);

app.use('/api', dashboardRouter);

app.get('/health', async (req, res) => {
  const { testConnection } = await import('./database/pool');
  const dbOk = await testConnection();
  res.json({ status: 'ok', database: dbOk ? 'connected' : 'disconnected' });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, businessWorker };
