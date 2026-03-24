/**
 * General business category templates.
 * Headline and tagline patterns for businesses without specific category.
 */

export const GENERAL_TEMPLATES = {
  categoryName: 'Local Business',
  categoryTaglines: [
    'Local Business',
    'Your Neighborhood Business',
    'Community Favorite',
    'Trusted Services',
    'Quality You Can Count On',
  ],
  neighborhoodPatterns: [
    (neighborhood: string) => `Serving ${neighborhood}`,
    (neighborhood: string) => `Your ${neighborhood} business`,
    (neighborhood: string) => `Quality services in ${neighborhood}`,
  ],
  headline: (name: string, tagline: string) => `${name} - ${tagline}`,
  about: {
    tone: 'confident but warm - professional but approachable, sounds like a trusted neighbor recommending',
    structure: '2-3 paragraphs, first person plural (we/our)',
    avoid: [
      '"Best in town"',
      '"We guarantee satisfaction"',
      'generic corporate language',
      'invented details',
    ],
    include: [
      'specific services or products from social posts',
      'specific details from reviews',
      'what makes the business unique',
      'community involvement or local ties',
    ],
  },
};
