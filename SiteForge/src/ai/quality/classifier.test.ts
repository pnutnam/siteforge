import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyContentQuality, resetClient } from './classifier';

// Mock Anthropic client
const mockCreate = vi.fn();
const mockMessages = { create: mockCreate };

vi.mock('@anthropic-ai/sdk', () => {
  // Use a function (not arrow function) so it can be used as a constructor
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function MockAnthropic(this: { messages: typeof mockMessages }) {
    this.messages = mockMessages;
  }
  return { default: MockAnthropic };
});

describe('AI Quality Classifier', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    resetClient(); // Reset cached client to pick up new mock
  });

  it('classifies high quality content', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: '{"quality":"high","onBrand":true,"reasons":["Professional food photography"]}' }],
    });

    const item = {
      id: '1',
      source: 'instagram' as const,
      caption: 'Our signature dish - handmade pasta with truffle cream sauce',
      imageUrl: 'https://example.com/pasta.jpg',
      engagement: 500,
    };

    const result = await classifyContentQuality(item, 'Test Restaurant', 'restaurant');

    expect(result.quality).toBe('high');
    expect(result.onBrand).toBe(true);
    expect(result.reasons).toContain('Professional food photography');
  });

  it('rejects off-brand content', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: '{"quality":"low","onBrand":false,"reasons":["Party content"],"brandConcerns":["celebration"]}' }],
    });

    const item = {
      id: '2',
      source: 'instagram' as const,
      caption: 'Party time! #celebration #birthday #sale',
      imageUrl: 'https://example.com/party.jpg',
      engagement: 800,
    };

    const result = await classifyContentQuality(item, 'Test Restaurant', 'restaurant');

    // High engagement but off-brand should be rejected
    expect(result.quality).toBe('low');
    expect(result.onBrand).toBe(false);
  });

  it('handles parse failure with LOW default', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'INVALID_RESPONSE' }],
    });

    const item = {
      id: '3',
      source: 'facebook' as const,
      caption: 'Some content',
      engagement: 100,
    };

    const result = await classifyContentQuality(item, 'Test Business', 'general');

    expect(result.quality).toBe('low');
  });
});
