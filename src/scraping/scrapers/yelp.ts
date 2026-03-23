import { Browser, Page } from 'playwright-extra';
import { BaseScraper, RawScrapeData } from './base';
import { YelpSchema } from '../validation/schemas';
import { createStealthContext, createStealthBrowser } from '../stealth/context-builder';

export class YelpScraper extends BaseScraper {
  readonly source: 'yelp' = 'yelp';

  private browser: Browser | null = null;

  async scrape(businessId: string, url: string): Promise<RawScrapeData> {
    if (!this.browser) {
      this.browser = await createStealthBrowser();
    }

    const context = await createStealthContext(this.browser, {
      source: 'yelp',
      randomize: false,
    });

    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const data = await this.extractBusinessData(page);
      await context.close();

      return this.createRawScrapeData(businessId, url, data);
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  private async extractBusinessData(page: Page): Promise<Record<string, unknown>> {
    const businessName = await page.locator('h1').first().textContent() ?? '';
    const address = await page.locator('[data-address]').first().textContent() ?? '';
    const phone = await page.locator('[data-phone]').first().textContent() ?? '';

    const ratingStr = await page.locator('[data-testid="rating"]').getAttribute('aria-label') ?? '';
    const rating = parseFloat(ratingStr.replace(/[^0-9.]/g, '')) || undefined;

    const categories = await page.locator('[data-testid="categories"] a').allTextContents();

    const reviews: Array<Record<string, unknown>> = [];
    const reviewContainers = page.locator('[data-review-id]');

    for (let i = 0; i < Math.min(await reviewContainers.count(), 20); i++) {
      const container = reviewContainers.nth(i);
      const author = await container.locator('[data-testid="author"]').textContent() ?? '';
      const ratingAttr = await container.locator('[data-testid="rating"]').getAttribute('aria-label') ?? '';
      const reviewRating = parseInt(ratingAttr.replace(/\D/g, ''), 10);
      const text = await container.locator('[data-testid="review-text"]').textContent() ?? '';
      const date = await container.locator('[data-testid="date-of-review"]').textContent() ?? '';
      const helpfulStr = await container.locator('[data-testid="helpful"]').textContent().catch(() => '0');
      const helpful = parseInt(helpfulStr.replace(/\D/g, ''), 10) || 0;

      reviews.push({
        id: await container.getAttribute('data-review-id') ?? `yelp-review-${i}`,
        author: author.trim(),
        rating: reviewRating,
        text: text.trim(),
        date: date.trim(),
        helpful,
      });
    }

    return {
      businessName: businessName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      rating,
      categories,
      reviews,
    };
  }

  protected async parseHtml(html: string, metadata: Record<string, unknown>): Promise<RawScrapeData> {
    throw new Error('Not used');
  }

  protected getValidationSchema() {
    return YelpSchema;
  }
}

export const yelpScraper = new YelpScraper();
