import { scrapeQueueEvents } from '../jobs/queue';
import { SourceType } from '../jobs/queue';

export interface SourceStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
  attempts: number;
  lastError?: string;
  updatedAt: Date;
}

export interface ScrapeStatus {
  businessId: string;
  tenantId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
  sources: Record<SourceType, SourceStatus>;
  startedAt: Date;
  completedAt?: Date;
}

const statusStore = new Map<string, ScrapeStatus>();

export function getScrapeStatus(businessId: string, tenantId: string): ScrapeStatus | undefined {
  const key = `${tenantId}:${businessId}`;
  return statusStore.get(key);
}

export function initScrapeStatus(
  businessId: string,
  tenantId: string,
  sources: SourceType[]
): ScrapeStatus {
  const status: ScrapeStatus = {
    businessId,
    tenantId,
    status: 'pending',
    sources: {} as Record<SourceType, SourceStatus>,
    startedAt: new Date(),
  };
  for (const source of sources) {
    status.sources[source] = {
      status: 'pending',
      attempts: 0,
      updatedAt: new Date(),
    };
  }
  const key = `${tenantId}:${businessId}`;
  statusStore.set(key, status);
  return status;
}

export function updateSourceStatus(
  businessId: string,
  tenantId: string,
  source: SourceType,
  update: Partial<SourceStatus>
): void {
  const key = `${tenantId}:${businessId}`;
  const status = statusStore.get(key);
  if (!status) return;

  status.sources[source] = {
    ...status.sources[source],
    ...update,
    updatedAt: new Date(),
  };

  const sourceStatuses = Object.values(status.sources).map(s => s.status);
  if (sourceStatuses.every(s => s === 'completed')) {
    status.status = 'completed';
    status.completedAt = new Date();
  } else if (sourceStatuses.some(s => s === 'failed')) {
    status.status = sourceStatuses.some(s => s === 'completed' || s === 'partial') ? 'partial' : 'failed';
    if (status.status === 'failed') status.completedAt = new Date();
  } else if (sourceStatuses.some(s => s === 'in_progress')) {
    status.status = 'in_progress';
  }

  statusStore.set(key, status);
}

export function updateBusinessStatus(
  businessId: string,
  tenantId: string,
  statusUpdate: Partial<ScrapeStatus>
): void {
  const key = `${tenantId}:${businessId}`;
  const current = statusStore.get(key);
  if (!current) return;
  statusStore.set(key, { ...current, ...statusUpdate });
}

export function subscribeToScrapeEvents(
  businessId: string,
  tenantId: string
): () => void {
  const handlers: Array<() => void> = [];

  handlers.push(
    scrapeQueueEvents.on('waiting', ({ jobId }) => {})
  );

  handlers.push(
    scrapeQueueEvents.on('active', ({ jobId, name }) => {
      const source = name as SourceType;
      if (['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'].includes(source)) {
        updateSourceStatus(businessId, tenantId, source, {
          status: 'in_progress',
          attempts: (status.sources[source]?.attempts || 0) + 1,
        });
      }
    })
  );

  handlers.push(
    scrapeQueueEvents.on('completed', ({ jobId, name }) => {
      const source = name as SourceType;
      if (['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'].includes(source)) {
        updateSourceStatus(businessId, tenantId, source, { status: 'completed' });
      }
    })
  );

  handlers.push(
    scrapeQueueEvents.on('failed', ({ jobId, name, failedReason }) => {
      const source = name as SourceType;
      if (['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'].includes(source)) {
        updateSourceStatus(businessId, tenantId, source, {
          status: 'failed',
          lastError: failedReason,
        });
      }
    })
  );

  return () => handlers.forEach(h => h());
}
