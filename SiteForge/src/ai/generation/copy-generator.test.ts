import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSiteCopy, resetClient } from './copy-generator';
import { RESTAURANT_TEMPLATES } from './prompts/restaurant';

// Mock Anthropic client
const mockCreate = vi.fn();
const mockMessages = { create: mockCreate };

vi.mock('@anthropic-ai/sdk', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function MockAnthropic(this: { messages: typeof mockMessages }) {
    this.messages = mockMessages;
  }
  return { default: MockAnthropic };
});

describe('Copy Generator', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    resetClient();
  });

  it('generates template-driven headline', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'Generated about section text...' }],
    });

    const socialPosts = [
      { id: '1', source: 'instagram' as const, caption: 'Great food!', engagement: 100 },
    ];
    const reviews = [
      { author: 'John', text: 'Amazing experience with many specific details about the dishes and the service we received during our visit.', rating: 5, date: '2024-01-01' },
    ];

    const result = await generateSiteCopy('Test Restaurant', 'restaurant', '123 Main St, Brooklyn, NY', socialPosts, reviews);

    expect(result.headline).toContain('Test Restaurant');
    // Should use one of the restaurant taglines
    const validTaglines = RESTAURANT_TEMPLATES.categoryTaglines;
    const hasValidTagline = validTaglines.some(tagline => result.headline.includes(tagline));
    expect(hasValidTagline).toBe(true);
  });

  it('generates neighborhood-based tagline', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'Generated about section text...' }],
    });

    const result = await generateSiteCopy('Test Salon', 'salon', '456 Oak Ave, Manhattan, NY', [], []);

    expect(result.tagline).toContain('Manhattan');
  });

  it('calls AI for about section', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'Generated about section text...' }],
    });

    await generateSiteCopy('Test Business', 'general', undefined, [], []);

    expect(mockCreate).toHaveBeenCalled();
  });

  it('returns GeneratedContent structure', async () => {
    mockCreate.mockResolvedValue({
      content: [{ text: 'Generated about section text...' }],
    });

    const result = await generateSiteCopy('Test Restaurant', 'restaurant', '123 Main St, Brooklyn, NY', [], []);

    expect(result).toHaveProperty('headline');
    expect(result).toHaveProperty('tagline');
    expect(result).toHaveProperty('about');
    expect(result).toHaveProperty('testimonials');
    expect(result).toHaveProperty('images');
    expect(result).toHaveProperty('quality');
  });
});
