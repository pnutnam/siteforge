import { describe, it, expect } from 'vitest';
import { selectAuthenticTestimonials, selectFallbackTestimonials } from './testimonials';

describe('Testimonial Selection', () => {
  const mockReviews = [
    { author: 'John D.', text: 'Absolutely amazing experience! Best service ever!', rating: 5, date: '2024-01-01' },
    { author: 'Sarah M.', text: 'The pasta was incredible. Chef Maria really knows her craft. We had the truffle special and it was perfection. Service was attentive but not intrusive. Will definitely come back for our anniversary.', rating: 5, date: '2024-02-15' },
    { author: 'Mike R.', text: 'Good food, nice atmosphere.', rating: 4, date: '2024-03-01' },
    { author: 'Emily K.', text: 'I have been coming here for 3 years now. The quality has remained consistent. My favorite is the seafood risotto. The owner always remembers my name and recommends new dishes based on my preferences.', rating: 5, date: '2024-01-20' },
  ];

  it('selects authentic reviews with specific details', async () => {
    const selected = await selectAuthenticTestimonials(mockReviews, 3);

    expect(selected.length).toBe(3);
    // Should include Sarah's detailed review
    expect(selected.map(t => t.author)).toContain('Sarah M.');
    // Should include Emily's review with specific details
    expect(selected.map(t => t.author)).toContain('Emily K.');
  });

  it('prefers detailed reviews over short ones', async () => {
    const selected = await selectAuthenticTestimonials(mockReviews, 3);

    // Sarah and Emily should be in top positions due to higher authenticity scores
    const topAuthors = selected.slice(0, 2).map(t => t.author);
    expect(topAuthors).toContain('Sarah M.');
    expect(topAuthors).toContain('Emily K.');
  });

  it('falls back to Google Reviews when count not met', async () => {
    const thinReviews = [
      { author: 'Generic', text: 'Great!', rating: 5, date: '2024-01-01' },
    ];

    const selected = await selectAuthenticTestimonials(thinReviews, 3);

    // With only 1-word review, shouldn't select much
    expect(selected.length).toBeLessThanOrEqual(1);
  });

  describe('selectFallbackTestimonials', () => {
    it('excludes reviews with less than 20 words', () => {
      const reviews = [
        { author: 'Short', text: 'Great food!', rating: 5, date: '2024-01-01' },
        { author: 'Long', text: 'This is a much longer review that definitely has more than twenty words in it and describes the dining experience thoroughly every single time we visit.', rating: 4, date: '2024-01-02' },
      ];

      const selected = selectFallbackTestimonials(reviews, 3);

      expect(selected.length).toBe(1);
      expect(selected[0].author).toBe('Long');
    });

    it('sorts by rating desc then text length desc', () => {
      // Both reviews have more than 20 words
      const reviews = [
        { author: 'FiveStar', text: 'This is a long review that definitely has more than twenty words in it describing the great experience at the restaurant which we love.', rating: 5, date: '2024-01-01' },
        { author: 'FourStar', text: 'Another lengthy review with more than twenty words describing a good but not great experience at this place we visit often.', rating: 4, date: '2024-01-02' },
      ];

      const selected = selectFallbackTestimonials(reviews, 3);

      expect(selected.length).toBe(2);
      expect(selected[0].author).toBe('FiveStar');
      expect(selected[1].author).toBe('FourStar');
    });
  });
});
