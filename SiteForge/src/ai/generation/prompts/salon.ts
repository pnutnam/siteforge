/**
 * Salon category templates.
 * Headline and tagline patterns for salon/beauty businesses.
 */

export const SALON_TEMPLATES = {
  categoryName: 'Beauty & Wellness',
  categoryTaglines: [
    'Beauty & Wellness',
    'Hair Salon',
    'Spa & Salon',
    'Style Studio',
    'Grooming & Beauty',
  ],
  neighborhoodPatterns: [
    (neighborhood: string) => `Look your best in ${neighborhood}`,
    (neighborhood: string) => `Beauty services in ${neighborhood}`,
    (neighborhood: string) => `${neighborhood}'s go-to salon`,
  ],
  headline: (name: string, tagline: string) => `${name} - ${tagline}`,
  about: {
    tone: 'confident but warm - professional but approachable, highlights quality without being salesy',
    structure: '2-3 paragraphs, first person plural (we/our)',
    avoid: [
      '"Best salon in town"',
      '"We guarantee satisfaction"',
      'unsubstantiated claims',
      'generic service descriptions',
    ],
    include: [
      'specific services or techniques from social posts',
      'what makes the stylists special from reviews',
      'the experience and atmosphere',
      'any specialized expertise',
    ],
  },
};
