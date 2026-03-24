/**
 * Restaurant category templates.
 * Headline and tagline patterns for restaurant businesses.
 */

export const RESTAURANT_TEMPLATES = {
  categoryName: 'Restaurant',
  categoryTaglines: [
    'Authentic Cuisine',
    'Fine Dining',
    'Farm-to-Table Kitchen',
    'Neighborhood Favorite',
    'Local Eatery',
  ],
  neighborhoodPatterns: [
    (neighborhood: string) => `Authentic cuisine in ${neighborhood}`,
    (neighborhood: string) => `Great food in ${neighborhood}`,
    (neighborhood: string) => `${neighborhood}'s favorite restaurant`,
  ],
  headline: (name: string, tagline: string) => `${name} - ${tagline}`,
  about: {
    tone: 'confident but warm - professional but approachable, sounds like a trusted neighbor recommending',
    structure: '2-3 paragraphs, first person plural (we/our)',
    avoid: [
      'generic phrases like "Best in town"',
      '"We guarantee satisfaction"',
      'superlatives not supported by data',
      'invented details or awards',
    ],
    include: [
      'specific dishes or signature items from social posts',
      'specific details from reviews',
      'what makes the restaurant unique',
      'the atmosphere or experience',
    ],
  },
};
