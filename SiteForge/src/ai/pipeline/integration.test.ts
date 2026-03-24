import { describe, it, expect, vi } from 'vitest';
import { createAIPipelineFlow } from './orchestrator';

// Use vi.hoisted to define mock functions that can be referenced in vi.mock
const { mockAdd } = vi.hoisted(() => {
  return {
    mockAdd: vi.fn().mockResolvedValue({ id: 'flow-1' }),
  };
});

// Mock flowProducer
vi.mock('../../jobs/queue', () => ({
  flowProducer: {
    add: mockAdd,
  },
  QUEUE_NAMES: {
    GENERATION: 'generation',
  },
}));

describe('AI Pipeline Integration', () => {
  it('creates flow with parent and children', async () => {
    const flow = await createAIPipelineFlow({
      businessId: 'biz-1',
      tenantId: 'tenant-1',
    });

    expect(flow).toBeDefined();
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ai-pipeline',
        queueName: 'generation',
        children: expect.arrayContaining([
          expect.objectContaining({ name: 'image-select' }),
          expect.objectContaining({ name: 'copy-write' }),
        ]),
      })
    );
  });
});
