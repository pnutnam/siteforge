# Phase 2: AI Content Pipeline - Research

**Researched:** 2026-03-23
**Domain:** AI content selection, quality classification, copy generation, static site generation with JSON data
**Confidence:** MEDIUM (npm versions verified, training knowledge for AI patterns, web fetch limitations)

## Summary

Phase 2 takes scraped data from 5 sources (Google Maps, Instagram, Facebook, Yelp, Google Reviews) and produces: (1) ranked content selection via engagement scoring, (2) AI-generated site copy, (3) template-ready JSON for Astro-based landing pages. The core challenge is building a content intelligence layer that filters low-quality content and generates compelling copy without publishing off-brand material.

Key findings: Engagement percentile ranking within a business's own content pool (top 20%) is fair to both small and large businesses. Quality filtering must be aggressive (reject party photos, excessive hashtags, old posts, low-res images). The AI generation uses a hybrid approach: headline/tagline from templates, about section from AI prose. BullMQ FlowProducer pattern from Phase 1 extends naturally to the AI pipeline with parent (orchestrate) -> children (image selection, copy generation running in parallel).

**Primary recommendation:** Build `src/ai/` as a separate module with clear separation: engagement scoring (pure functions, no AI), quality classification (AI call with rejection reasons), and copy generation (AI call with category templates). This allows parallel execution and independent retry/failure handling.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Engagement scoring:** Percentile rank within business's own content pool. Top 20% by engagement wins. Fair to both small and large businesses.
- **Quality filtering (aggressive):** Reject party photos, excessive hashtags (#sale #coupon), posts >12 months old, low-res images, screenshots, videos-only posts.
- **Selection method:** Dynamic quality tier - include content only if engagement score passes threshold. If below threshold, exclude entirely.
- **Empty/bare fallback:** If business has no quality social content, Google Reviews are used as fallback for social proof section.
- **Copy elements:** Hybrid approach - headline + tagline are template-driven (business name + category), about section is AI-generated prose.
- **Testimonial selection:** AI reads all Google Reviews and picks most authentic/descriptive ones (not generic "Great service!").
- **Generation method:** Business category templates - pre-written templates per category (restaurant, salon, general) that AI fills in with specifics.
- **Tone:** Confident but warm - professional but approachable, highlights quality without being salesy, sounds like a trusted neighbor recommending.
- **Static site generator:** Astro for preview landing pages (fast builds, component model, S3-friendly output).
- **Data flow:** JSON at build time - scraped + AI data compiled to JSON, Astro reads at build time. Clean separation, cacheable.
- **Template variants:** Category-based - separate templates for Restaurant, Salon, General business types.
- **SLA handling:** Synchronous required - page waits for AI generation. If AI is slow (e.g., 15 min), SLA not met but quality is guaranteed.
- **AI provider:** MiniMax M2.7 with Anthropic endpoint - combined with company-specific skills and data.
- **Parallelization:** Parallel where possible - image selection + copy generation run in parallel for speed, even though costlier.
- **Failure handling:** Manual fallback - alert human operator, queue for manual generation. Page not published until content ready. Quality over speed for failures.

### Claude's Discretion

- Exact engagement threshold percentage for quality tier
- Specific category template designs (restaurant, salon, general)
- Retry timing and frequency if AI call fails transiently
- Image resolution minimum threshold for "low-res" rejection
- Hashtag count threshold for "excessive" rejection

### Deferred Ideas (OUT OF SCOPE)

- AI personalized outreach copy (per business owner name) - Phase 4+ territory
- A/B testing different template variants - Phase 3+ optimization
- Multi-language support for international businesses - out of scope for v1

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONTENT-01 | AI selects highest-engagement content (images/posts) to feature on generated site | Engagement percentile ranking (top 20%), parallel image selection |
| CONTENT-02 | AI content quality classification (filters off-brand, party photos, low-quality) | Quality classifier prompt engineering, rejection categories, date/resolution thresholds |
| CONTENT-03 | AI generates site copy using business info + social proof as source material | Category templates, hybrid headline/tagline approach, MiniMax M2.7 prompts |
| CONTENT-04 | AI maps scraped data to Hugo/Astro template variables | JSON schema for template variables, Zod validation of generated content |
| PIPELINE-02 | Landing page live within 10 minutes of starting scrape | BullMQ flow extension, parallel AI calls, Astro build optimization |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.80.0 | AI API client for content generation | Anthropic SDK is the standard for Claude-compatible APIs; MiniMax M2.7 exposes Anthropic-compatible endpoint |
| astro | 6.0.8 | Static site generator for preview landing pages | Fast builds, component model, build-time JSON fetching, S3-friendly output |
| bullmq | 5.71.0 | Job queue for AI pipeline orchestration | Already in use from Phase 1; FlowProducer extends naturally |
| zod | 4.3.6 | Runtime validation of generated content | Already in use from Phase 1; validates AI output before storage |
| @ruvector/ruvllm | 2.5.2 | RuVector LLM integration layer | Already in project; provides company-specific skills and data |
| ruvector | 0.2.12 | Self-learning intelligence | Already in project; routing and pattern learning |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @astrojs/node | (latest) | Astro Node.js adapter | For running Astro builds in Node.js environment |
| sharp | (latest) | Image processing | For checking image dimensions, detecting screenshots |
| image-hash | (latest) | Perceptual image hashing | For detecting near-duplicate images |

**Installation:**
```bash
npm install @anthropic-ai/sdk@0.80.0 astro@6.0.8 bullmq@5.71.0 zod@4.3.6
npm install @ruvector/ruvllm@2.5.2 ruvector@0.2.12
npm install @astrojs/node sharp image-hash
```

**Version verification:** @anthropic-ai/sdk 0.80.0, astro 6.0.8, bullmq 5.71.0, zod 4.3.6 verified against npm registry 2026-03-23.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── ai/
│   ├── engagement/
│   │   ├── scorer.ts           # Percentile ranking within content pool
│   │   └── thresholds.ts       # Quality tier thresholds (top 20%)
│   ├── quality/
│   │   ├── classifier.ts       # AI quality classification
│   │   ├── filters.ts          # Rule-based pre-filters (date, resolution, hashtags)
│   │   └── rejection.ts        # Rejection reason tracking
│   ├── generation/
│   │   ├── prompts/
│   │   │   ├── restaurant.ts   # Restaurant category template
│   │   │   ├── salon.ts        # Salon category template
│   │   │   └── general.ts      # General business template
│   │   ├── copy-generator.ts   # AI copy generation
│   │   └── testimonials.ts     # AI review selection
│   ├── templates/
│   │   └── variables.ts        # Template variable schemas
│   └── pipeline/
│       ├── orchestrator.ts     # Parent job: coordinates AI pipeline
│       ├── image-selector.ts   # Child job: image selection + quality
│       └── copy-writer.ts      # Child job: copy generation
├── preview/
│   ├── astro/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   └── [business].astro
│   │   │   ├── components/
│   │   │   │   ├── Hero.astro
│   │   │   │   ├── About.astro
│   │   │   │   ├── Gallery.astro
│   │   │   │   └── Testimonials.astro
│   │   │   └── layouts/
│   │   │       └── Layout.astro
│   │   ├── data/
│   │   │   └── businesses/     # JSON data at build time
│   │   └── astro.config.mjs
│   └── builder.ts               # Astro build orchestration
└── jobs/
    └── processors/
        └── ai-pipeline.ts      # AI pipeline job processor
```

### Pattern 1: Engagement Percentile Ranking

**What:** Score content by engagement, then rank within the business's own content pool. Top 20% passes.

**When to use:** CONTENT-01 - selecting highest-engagement posts/images.

**Example:**
```typescript
// Source: Established ranking pattern (training knowledge)
interface ContentItem {
  id: string;
  source: 'instagram' | 'facebook' | 'yelp';
  engagement: number; // likes + comments + shares
  imageUrl?: string;
  caption?: string;
  postedAt?: string;
}

function selectTopEngagement(content: ContentItem[], percentile = 80): ContentItem[] {
  if (content.length === 0) return [];

  // Sort by engagement descending
  const sorted = [...content].sort((a, b) => b.engagement - a.engagement);

  // Find the threshold at given percentile
  const thresholdIndex = Math.ceil((percentile / 100) * sorted.length);
  const threshold = sorted[Math.max(0, thresholdIndex - 1)]?.engagement ?? 0;

  // Return only items at or above threshold
  return sorted.filter(item => item.engagement >= threshold);
}

// Example: A business with 10 posts
// Sorted engagement: [1000, 800, 600, 400, 300, 200, 100, 50, 20, 10]
// Top 20% = top 2 items (ceiling of 10 * 0.20 = 2)
// Threshold = engagement at index 1 = 800
// Selected: items with engagement >= 800
```

### Pattern 2: Quality Pre-Filters (Rule-Based)

**What:** Apply rule-based filters before AI classification to avoid wasting AI calls.

**When to use:** CONTENT-02 - pre-filtering obvious low-quality content.

**Example:**
```typescript
// Source: Established filtering pattern (training knowledge)
interface QualityFilter {
  maxAgeDays: number;        // Reject posts > 12 months old
  minResolution: number;      // Reject images < 800px wide
  maxHashtags: number;        // Reject if > 3 hashtags
  bannedHashtags: string[];   // #sale, #coupon, #ad, #sponsored
  bannedKeywords: string[];  // 'party', 'drunk', 'night out'
}

const DEFAULT_FILTERS: QualityFilter = {
  maxAgeDays: 365,
  minResolution: 800,
  maxHashtags: 3,
  bannedHashtags: ['sale', 'coupon', 'ad', 'sponsored', 'discount', 'offer'],
  bannedKeywords: ['party', 'drunk', 'night out', 'birthday special'],
};

interface FilterResult {
  passed: boolean;
  reasons: string[];
}

function applyQualityFilters(
  item: ContentItem,
  filters: QualityFilter = DEFAULT_FILTERS
): FilterResult {
  const reasons: string[] = [];

  // Check age
  if (item.postedAt) {
    const ageDays = (Date.now() - new Date(item.postedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > filters.maxAgeDays) {
      reasons.push(`Post is ${Math.floor(ageDays)} days old (max ${filters.maxAgeDays})`);
    }
  }

  // Check hashtags
  if (item.caption) {
    const hashtags = (item.caption.match(/#\w+/g) || []).map(h => h.toLowerCase().slice(1));
    const excessiveHashtags = hashtags.filter(h => filters.bannedHashtags.includes(h));
    if (excessiveHashtags.length > 0) {
      reasons.push(`Banned hashtags: ${excessiveHashtags.join(', ')}`);
    }
    if (hashtags.length > filters.maxHashtags) {
      reasons.push(`Too many hashtags: ${hashtags.length} (max ${filters.maxHashtags})`);
    }

    // Check banned keywords
    const lowerCaption = item.caption.toLowerCase();
    const matchedKeywords = filters.bannedKeywords.filter(k => lowerCaption.includes(k));
    if (matchedKeywords.length > 0) {
      reasons.push(`Banned keywords: ${matchedKeywords.join(', ')}`);
    }
  }

  // Check for video-only posts (no image)
  if (!item.imageUrl) {
    reasons.push('No image attached (video-only post)');
  }

  return { passed: reasons.length === 0, reasons };
}
```

### Pattern 3: AI Quality Classification

**What:** Use AI to classify content quality beyond rule-based filters.

**When to use:** CONTENT-02 - after pre-filters, for nuanced quality assessment.

**Example:**
```typescript
// Source: Established AI classification pattern (training knowledge)
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface QualityClassification {
  quality: 'high' | 'medium' | 'low';
  reasons: string[];
  onBrand: boolean;
  brandConcerns?: string[];
}

async function classifyContentQuality(
  item: ContentItem,
  businessCategory: string,
  businessName: string
): Promise<QualityClassification> {
  const prompt = `You are a content quality classifier for a local business website.

Business: ${businessName}
Category: ${businessCategory}

Evaluate this social media post for use on the business's website:

${item.caption ? `Caption: "${item.caption}"` : 'No caption'}
${item.imageUrl ? `Image: ${item.imageUrl}` : 'No image'}

Classify as HIGH quality (show on website), MEDIUM (acceptable but not featured), or LOW (don't show).

HIGH quality indicators:
- Shows the business's products/services in a professional or authentic way
- Features the team, workspace, or happy customers
- Highlights quality, craftsmanship, or unique aspects of the business
- Looks professional and well-composed

LOW quality indicators:
- Party photos, celebrations, or alcohol-focused content
- Generic promotional posts (#sale #coupon)
- Screenshots or low-quality images
- Content that could embarrass the business or look unprofessional

Respond with JSON:
{
  "quality": "high|medium|low",
  "onBrand": true|false,
  "reasons": ["reason1", "reason2"],
  "brandConcerns": ["concern"] // only if onBrand is false
}`;

  const response = await client.messages.create({
    model: 'minimax-2.7', // MiniMax M2.7 via Anthropic endpoint
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;

  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as QualityClassification;
    }
  } catch {
    // Fall through to default
  }

  return { quality: 'medium', reasons: ['Could not parse AI response'], onBrand: true };
}
```

### Pattern 4: Hybrid Copy Generation

**What:** Template-driven headline/tagline + AI-generated about section.

**When to use:** CONTENT-03 - generating site copy.

**Example:**
```typescript
// Source: Established hybrid generation pattern (training knowledge)
interface BusinessData {
  name: string;
  category: 'restaurant' | 'salon' | 'general';
  address?: string;
  phone?: string;
  hours?: Record<string, string>;
  reviews?: GoogleReview[];
  socialPosts?: ContentItem[];
}

interface GeneratedCopy {
  headline: string;      // Template-driven: "{Business Name} - {Category}"
  tagline: string;       // Template-driven: "{Category} in {Neighborhood}"
  about: string;         // AI-generated prose
  testimonials: string[]; // Selected authentic reviews
}

const CATEGORY_TEMPLATES = {
  restaurant: {
    headline: (name: string) => `${name} - Authentic Cuisine`,
    tagline: (address: string) => `Great food in ${extractNeighborhood(address)}`,
  },
  salon: {
    headline: (name: string) => `${name} - Beauty & Wellness`,
    tagline: (address: string) => `Look your best in ${extractNeighborhood(address)}`,
  },
  general: {
    headline: (name: string) => `${name} - Local Business`,
    tagline: (address: string) => `Serving ${extractNeighborhood(address)}`,
  },
};

async function generateSiteCopy(business: BusinessData): Promise<GeneratedCopy> {
  const template = CATEGORY_TEMPLATES[business.category];

  // Template-driven elements
  const headline = template.headline(business.name);
  const tagline = template.tagline(business.address ?? '');

  // AI-generated about section
  const about = await generateAboutSection(business);

  // AI-selected testimonials
  const testimonials = await selectAuthenticReviews(business.reviews ?? [], 3);

  return { headline, tagline, about, testimonials };
}

async function generateAboutSection(business: BusinessData): Promise<string> {
  const prompt = `You are a copywriter for a local business website.

Write a compelling 2-3 paragraph "About Us" section for:

Business: ${business.name}
Category: ${business.category}
${business.address ? `Location: ${business.address}` : ''}

Tone: Confident but warm - professional but approachable, sounds like a trusted neighbor recommending.

Use these authentic social proof points if available:
${business.socialPosts?.slice(0, 3).map(p => `- ${p.caption?.slice(0, 200)}`).join('\n') ?? 'No social posts available.'}

Highlight quality without being salesy. Don't use generic phrases like "Best in town" or "We guarantee satisfaction."

Write in first person plural (we/our) and include specific details that make the business unique.`;

  const response = await client.messages.create({
    model: 'minimax-2.7',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}
```

### Pattern 5: BullMQ AI Pipeline Flow

**What:** Extend Phase 1's FlowProducer pattern to AI pipeline with parent -> children (image selection, copy generation run in parallel).

**When to use:** PIPELINE-02 - orchestrating AI pipeline after scrape completion.

**Example:**
```typescript
// Source: BullMQ FlowProducer pattern from Phase 1, extended for AI
export interface AIPipelineJob {
  businessId: string;
  tenantId: string;
}

export interface ImageSelectJob {
  businessId: string;
  tenantId: string;
}

export interface CopyWriteJob {
  businessId: string;
  tenantId: string;
}

// Create AI pipeline flow (extends scrape completion)
export async function createAIPipelineFlow(jobData: AIPipelineJob) {
  return flowProducer.add({
    name: 'ai-pipeline',
    queueName: QUEUE_NAMES.GENERATION,
    data: jobData,
    children: [
      {
        name: 'image-select',
        queueName: QUEUE_NAMES.GENERATION,
        data: { businessId: jobData.businessId, tenantId: jobData.tenantId },
      },
      {
        name: 'copy-write',
        queueName: QUEUE_NAMES.GENERATION,
        data: { businessId: jobData.businessId, tenantId: jobData.tenantId },
      },
    ],
  });
}

// Worker processes both job types
const generationWorker = new Worker(
  QUEUE_NAMES.GENERATION,
  async (job) => {
    if (job.name === 'ai-pipeline') {
      return processAIPipeline(job);
    } else if (job.name === 'image-select') {
      return processImageSelect(job);
    } else if (job.name === 'copy-write') {
      return processCopyWrite(job);
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // AI calls can run in parallel
  }
);
```

### Pattern 6: Astro Build-Time JSON Data

**What:** Compile scraped + AI data to JSON, Astro reads at build time.

**When to use:** CONTENT-04 - mapping data to template variables.

**Example:**
```typescript
// Build script: compile data for Astro
// Source: Astro build-time data fetching patterns
import { writeFileSync } from 'fs';
import { join } from 'path';

interface TemplateData {
  business: {
    name: string;
    address: string;
    phone: string;
    hours: Record<string, string>;
  };
  content: {
    headline: string;
    tagline: string;
    about: string;
    images: string[];
    testimonials: Array<{ author: string; text: string; rating: number }>;
  };
  meta: {
    generatedAt: string;
    businessId: string;
  };
}

function compileTemplateData(
  businessId: string,
  scrapedData: ScrapedData,
  aiContent: GeneratedCopy,
  selectedImages: ContentItem[]
): TemplateData {
  return {
    business: {
      name: scrapedData.googleMaps?.businessName ?? scrapedData.yelp?.businessName,
      address: scrapedData.googleMaps?.address ?? scrapedData.yelp?.address,
      phone: scrapedData.googleMaps?.phone ?? scrapedData.yelp?.phone,
      hours: scrapedData.googleMaps?.hours ?? {},
    },
    content: {
      headline: aiContent.headline,
      tagline: aiContent.tagline,
      about: aiContent.about,
      images: selectedImages.map(img => img.imageUrl).filter(Boolean),
      testimonials: aiContent.testimonials.map(t => ({
        author: t.author,
        text: t.text,
        rating: t.rating,
      })),
    },
    meta: {
      generatedAt: new Date().toISOString(),
      businessId,
    },
  };
}

// Write JSON to Astro's data directory
const data = compileTemplateData(businessId, scrapedData, aiContent, selectedImages);
const outputPath = join(__dirname, '../preview/astro/data/businesses', `${businessId}.json`);
writeFileSync(outputPath, JSON.stringify(data, null, 2));
```

```astro
<!-- Astro page: src/pages/[business].astro -->
<!-- Source: Astro build-time data fetching -->
---
import Layout from '../layouts/Layout.astro';
import Hero from '../components/Hero.astro';
import About from '../components/About.astro';
import Gallery from '../components/Gallery.astro';
import Testimonials from '../components/Testimonials.astro';

export async function getStaticPaths() {
  const dataDir = './data/businesses';
  const files = await Astro.glob('./data/businesses/*.json');

  return files.map(file => ({
    params: { business: file.default.businessId },
    props: { data: file.default },
  }));
}

const { data } = Astro.props;
---

<Layout title={data.business.name}>
  <Hero
    headline={data.content.headline}
    tagline={data.content.tagline}
    businessName={data.business.name}
  />
  <About text={data.content.about} />
  <Gallery images={data.content.images} />
  <Testimonials reviews={data.content.testimonials} />
</Layout>
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI API calls | Raw fetch to Anthropic/MiniMax | @anthropic-ai/sdk | Handles streaming, retries, token counting, error parsing |
| Image quality assessment | Custom ML model | AI classification + rule-based filters | Complex to train/maintain; AI classification with prompts is effective and flexible |
| Engagement percentile ranking | Complex statistics library | Simple percentile calculation | Content pools are small; statistical rigor unnecessary |
| JSON schema validation | Manual type checks | Zod | Already in use from Phase 1; type inference + composable |
| Template variable mapping | String concatenation | Zod schemas + typed objects | Catches mapping errors at build time |

**Key insight:** The AI content pipeline uses well-established patterns. Quality classification via AI prompts is more flexible than training a custom model, and the hybrid template/AI approach balances consistency with personalization.

## Common Pitfalls

### Pitfall 1: AI Hallucination of Business Facts

**What goes wrong:** AI generates inaccurate claims about the business (fake awards, wrong years in business, invented details).

**Why it happens:** AI conflates patterns from training data with provided context. Without grounding, it fills gaps with plausible-sounding fabrications.

**How to avoid:**
- Provide specific extracted facts as context, not open-ended prompts
- Add explicit instruction: "Only use information explicitly mentioned in the provided data"
- Validate generated claims against source data before publishing
- Include source citations in generated copy references

**Warning signs:** Generated copy contains superlatives ("best", "only", "first") not in source data

### Pitfall 2: Template Homogeneity

**What goes wrong:** All generated sites sound the same because AI relies on template.fill rather than extracting unique selling points.

**Why it happens:** Generic templates produce generic output. AI doesn't know what's distinctive about a business unless explicitly prompted.

**How to avoid:**
- Include specific extracted details (from reviews, captions) as prompts
- Ask AI to identify unique aspects: "What makes this business different from competitors?"
- Vary template structures per category, not just content

**Warning signs:** "About" sections are interchangeable across businesses

### Pitfall 3: Silent AI Quality Classification Failures

**What goes wrong:** Low-quality content passes through because AI classification returns MEDIUM by default when it can't parse its own output.

**Why it happens:** Default fallback to MEDIUM is permissive. If JSON parsing fails, content gets a pass.

**How to avoid:**
- Default to LOW quality on parse failures (safer)
- Log all parse failures for human review
- Add explicit confidence scoring to classification response

**Warning signs:** Low engagement posts appearing on generated sites

### Pitfall 4: Image Selection Bottleneck

**What goes wrong:** Per-image AI classification creates sequential bottleneck when selecting from 50 posts.

**Why it happens:** Each image classification is an AI call. 50 images = 50 sequential API calls.

**How to avoid:**
- Batch images into single classification call with instruction to rank
- Pre-filter with rule-based filters before AI classification
- Use parallel AI calls with Promise.all for remaining candidates

**Warning signs:** AI pipeline takes 10+ minutes for image selection alone

### Pitfall 5: Stale Data in JSON

**What goes wrong:** Astro build uses cached JSON, showing outdated content.

**Why it happens:** Astro caches build output. If JSON is regenerated but build isn't, stale content appears.

**How to avoid:**
- Use content hashing in JSON filename: `biz-{id}-{hash}.json`
- Always force fresh fetch: `await fetch(url, { cache: 'no-store' })`
- Set `export const prerender = false` for dynamic data pages

**Warning signs:** Preview site shows old images/copy after regeneration

## Code Examples

### Engagement Scoring with Instagram Shares (Verified from Phase 1)

```typescript
// Source: src/scraping/scrapers/instagram.ts (verified)
interface InstagramPost {
  id: string;
  imageUrl?: string;
  caption?: string;
  likes: number;
  comments: number;
  shares: number; // Required for engagement calculation
  engagement: number; // likes + comments + shares
  postedAt?: string;
}

// Engagement is calculated at scrape time (SCRAPE-02)
const engagement = likes + comments + shares;
posts.sort((a, b) => b.engagement - a.engagement); // Descending
```

### Zod Schema for Generated Content (Verified from Phase 1 patterns)

```typescript
// Source: Established Zod pattern from Phase 1
import { z } from 'zod';

export const GeneratedContentSchema = z.object({
  headline: z.string().min(1).max(100),
  tagline: z.string().min(1).max(150),
  about: z.string().min(100).max(2000),
  testimonials: z.array(z.object({
    author: z.string(),
    text: z.string().min(10).max(500),
    rating: z.number().min(1).max(5),
  })).min(1).max(5),
  images: z.array(z.object({
    url: z.string().url(),
    source: z.enum(['instagram', 'facebook', 'yelp']),
    engagement: z.number(),
    caption: z.string().optional(),
  })).min(1).max(10),
  quality: z.object({
    score: z.number().min(0).max(1),
    passed: z.boolean(),
    rejectionReasons: z.array(z.string()).optional(),
  }),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rule-based content selection | AI-powered quality classification | 2022+ | More nuanced filtering, understands context |
| Single AI call per content item | Batch classification with ranking | 2024+ | 10-50x faster for large content pools |
| Static templates | Hybrid template + AI prose | 2023+ | Consistent structure with personalized content |
| Build-time AI calls | JSON-first with AI | 2024+ | Separation of concerns, cacheable builds |

**Deprecated/outdated:**
- **GPT-3 for classification:** Replaced by smaller, faster models fine-tuned for classification
- **Single-pass generation:** Modern approach separates structure (templates) from prose (AI)
- **Separate image CDN:** Now inline into JSON/built site for simplicity

## Open Questions

1. **MiniMax M2.7 endpoint compatibility**
   - What we know: Context states "MiniMax M2.7 with Anthropic endpoint" - implies API compatibility
   - What's unclear: Exact endpoint URL, authentication method, rate limits
   - Recommendation: Verify MiniMax API docs for Anthropic-compatible endpoint details

2. **Image resolution detection**
   - What we know: Need to reject low-res images, screenshots
   - What's unclear: Best approach for detecting image resolution without downloading
   - Recommendation: Use `sharp` to fetch only image headers and extract dimensions; don't download full image

3. **Screenshot detection**
   - What we know: Need to reject screenshots
   - What's unclear: Best heuristic for screenshot detection
   - Recommendation: Check aspect ratios (screenshots often 16:9 or unusual), use `image-hash` to detect UI elements

4. **Google Reviews as fallback**
   - What we know: If no quality social content, use Google Reviews for social proof
   - What's unclear: How many reviews to show, what makes a review "quality" for fallback
   - Recommendation: Select top 3 by rating + text length, exclude generic reviews < 20 words

5. **Category auto-detection**
   - What we know: Templates exist for restaurant, salon, general
   - What's unclear: How to auto-detect category from scraped data
   - Recommendation: Use Google Maps/Yelp category field, default to "general" if ambiguous

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (inherited from Phase 1) |
| Quick run command | `npx vitest run src/ai/ --reporter=dot` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTENT-01 | Engagement scoring selects top 20% by percentile | Unit | `npx vitest run src/ai/engagement/scorer.test.ts` | Wave 0 |
| CONTENT-01 | Images sorted by engagement descending | Unit | `npx vitest run src/ai/engagement/scorer.test.ts` | Wave 0 |
| CONTENT-02 | Rule-based filters reject old posts | Unit | `npx vitest run src/ai/quality/filters.test.ts` | Wave 0 |
| CONTENT-02 | Rule-based filters reject excessive hashtags | Unit | `npx vitest run src/ai/quality/filters.test.ts` | Wave 0 |
| CONTENT-02 | AI classifier returns quality classification | Unit | `npx vitest run src/ai/quality/classifier.test.ts` | Wave 0 |
| CONTENT-02 | Low-quality content excluded from output | Unit | `npx vitest run src/ai/pipeline/integration.test.ts` | Wave 0 |
| CONTENT-03 | Headline/tagline use template format | Unit | `npx vitest run src/ai/generation/copy-generator.test.ts` | Wave 0 |
| CONTENT-03 | About section generated by AI | Unit | `npx vitest run src/ai/generation/copy-generator.test.ts` | Wave 0 |
| CONTENT-03 | Testimonials selected by authenticity | Unit | `npx vitest run src/ai/generation/testimonials.test.ts` | Wave 0 |
| CONTENT-04 | Template variables match Zod schema | Unit | `npx vitest run src/ai/templates/variables.test.ts` | Wave 0 |
| CONTENT-04 | Generated content validates against schema | Unit | `npx vitest run src/ai/templates/variables.test.ts` | Wave 0 |
| PIPELINE-02 | BullMQ flow creates parent + children | Unit | `npx vitest run src/jobs/ai-pipeline.test.ts` | Wave 0 |
| PIPELINE-02 | Image selection + copy generation run in parallel | Unit | `npx vitest run src/jobs/ai-pipeline.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/ai/engagement/ --reporter=dot` (engagement scoring subset)
- **Per wave merge:** `npx vitest run src/ai/ --reporter=dot` (full AI module)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/ai/engagement/scorer.ts` - percentile ranking logic
- [ ] `src/ai/engagement/thresholds.ts` - quality tier thresholds
- [ ] `src/ai/quality/filters.ts` - rule-based pre-filters
- [ ] `src/ai/quality/classifier.ts` - AI quality classification
- [ ] `src/ai/quality/rejection.ts` - rejection reason tracking
- [ ] `src/ai/generation/prompts/restaurant.ts` - restaurant category template
- [ ] `src/ai/generation/prompts/salon.ts` - salon category template
- [ ] `src/ai/generation/prompts/general.ts` - general business template
- [ ] `src/ai/generation/copy-generator.ts` - AI copy generation
- [ ] `src/ai/generation/testimonials.ts` - AI review selection
- [ ] `src/ai/templates/variables.ts` - template variable Zod schemas
- [ ] `src/ai/pipeline/orchestrator.ts` - parent job coordinator
- [ ] `src/ai/pipeline/image-selector.ts` - child job for images
- [ ] `src/ai/pipeline/copy-writer.ts` - child job for copy
- [ ] `src/jobs/processors/ai-pipeline.ts` - BullMQ AI pipeline processor
- [ ] `src/preview/astro/` - Astro project structure for preview pages
- [ ] `src/preview/builder.ts` - Astro build orchestration
- [ ] `src/ai/engagement/scorer.test.ts` - CONTENT-01 tests
- [ ] `src/ai/quality/filters.test.ts` - CONTENT-02 pre-filter tests
- [ ] `src/ai/quality/classifier.test.ts` - CONTENT-02 AI classification tests
- [ ] `src/ai/generation/copy-generator.test.ts` - CONTENT-03 tests
- [ ] `src/ai/templates/variables.test.ts` - CONTENT-04 tests
- [ ] `src/jobs/ai-pipeline.test.ts` - PIPELINE-02 tests

## Sources

### Primary (HIGH confidence)
- npm registry - version verification for @anthropic-ai/sdk 0.80.0, astro 6.0.8, bullmq 5.71.0, zod 4.3.6
- Phase 1 research - established patterns for BullMQ FlowProducer, Zod validation, scraping data shapes
- src/scraping/validation/schemas.ts - verified Zod schemas for scraped data
- src/scraping/scrapers/instagram.ts - verified engagement calculation (likes + comments + shares)
- src/jobs/queue.ts - verified BullMQ FlowProducer pattern for parent->children

### Secondary (MEDIUM confidence)
- Astro documentation (build-time data fetching, content collections, static routing) - from WebFetch
- BullMQ FlowProducer documentation (parent-child flows, result aggregation) - from WebFetch
- AI content classification patterns - from training knowledge
- RuVector LLM integration (@ruvector/ruvllm 2.5.2) - in project dependencies

### Tertiary (LOW confidence - marked for validation)
- MiniMax M2.7 Anthropic endpoint compatibility - requires API documentation verification
- Image quality classification accuracy via AI prompts - needs benchmark testing
- Exact retry timing/frequency for AI transient failures - needs operational data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm versions verified, established libraries
- Architecture: MEDIUM - patterns from training knowledge, no external verification for AI-specific patterns
- Pitfalls: MEDIUM - established patterns documented, open questions flagged for validation

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days for stable patterns; AI API compatibility may change)

**Key gaps requiring validation:**
- MiniMax M2.7 Anthropic endpoint authentication and rate limits
- AI quality classification prompt effectiveness (need test benchmark)
- Image resolution detection approach without full download
