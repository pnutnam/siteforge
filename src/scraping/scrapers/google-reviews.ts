import { Browser, Page } from 'playwright-extra';
import { BaseScraper, RawScrapeData } from './base';
import { GoogleReviewsSchema } from '../validation/schemas';
import { createStealthContext, createStealthBrowser } from '../stealth/context-builder';

export class GoogleReviewsScraper extends BaseScraper {
  readonly source: 'google_reviews' = 'google_reviews';

  private browser: Browser | null = null;

  async scrape(businessId: string, url: string): Promise<RawScrapeData> {
    if (!this.browser) {
      this.browser = await createStealthBrowser();
    }

    const context = await createStealthContext(this.browser, {
      source: 'google_reviews',
      randomize: false,
    });

    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const data = await this.extractReviewsData(page);
      await context.close();

      return this.createRawScrapeData(businessId, url, data);
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  private async extractReviewsData(page: Page): Promise<Record<string, unknown>> {
    const businessName = await page.locator('h1').first().textContent() ?? '';

    const ratingStr = await page.locator('[data-review-id]').first().locator('..').locator('[aria-label]').getAttribute('aria-label').catch(() => '');
    const rating = parseFloat(ratingStr?.replace(/[^0-9.]/g, '') ?? '') || undefined;

    const reviews: Array<Record<string, unknown>> = [];
    const reviewBlocks = page.locator('[data-review-id]');

    for (let i = 0; i < Math.min(await reviewBlocks.count(), 160); i++) {
      const review = reviewBlocks.nth(i);

      const author = await review.locator('.section-review-title').textContent() ?? '';
      const ratingAttr = await review.locator('.section-review-star-rating').getAttribute('aria-label') ?? '';
      const reviewRating = parseInt(ratingAttr.replace(/\D/g, ''), 10);
      const text = await review.locator('.section-review-text').textContent() ?? '';
      const date = await review.locator('.section-review-publish-date').textContent() ?? '';

      const response = await review.locator('.section-owner-response').textContent().catch(() => '');

      reviews.push({
        author: author.trim(),
        rating: reviewRating,
        text: text.trim(),
        date: date.trim(),
        response: response ? response.trim() : undefined,
      });
    }

    const totalStr = await page.locator('[data-testid="reviews"] .section-review-count').textContent().catch(() => '0');
    const totalReviews = parseInt(totalStr.replace(/\D/g, ''), 10) || reviews.length;

    return {
      businessName: businessName.trim(),
      rating,
      reviews,
      totalReviews,
    };
  }

  protected async parseHtml(html: string, metadata: Record<string, unknown>): Promise<RawScrapeData> {
    throw new Error('Not used');
  }

  protected getValidationSchema() {
    return GoogleReviewsSchema;
  }
}

export const googleReviewsScraper = new GoogleReviewsScraper();
