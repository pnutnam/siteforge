import { Browser, Page } from 'playwright-extra';
import { chromium } from 'playwright-extra';
import { BaseScraper, RawScrapeData } from './base';
import { GoogleMapsSchema } from '../validation/schemas';
import { createStealthContext, createStealthBrowser } from '../stealth/context-builder';

export class GoogleMapsScraper extends BaseScraper {
  readonly source: 'google_maps' = 'google_maps';

  private browser: Browser | null = null;

  async scrape(businessId: string, url: string): Promise<RawScrapeData> {
    if (!this.browser) {
      this.browser = await createStealthBrowser();
    }

    const context = await createStealthContext(this.browser, {
      source: 'google_maps',
      randomize: false,
    });

    const page = await context.newPage();

    try {
      await this.navigateWithRetry(page, url);
      const data = await this.extractBusinessData(page);
      await context.close();

      const raw = this.createRawScrapeData(businessId, url, data);
      this.validate(raw);

      return raw;
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  private async navigateWithRetry(page: Page, url: string, attempt = 1): Promise<void> {
    const maxAttempts = 3;
    const baseDelay = 3000;

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const title = await page.title();
      if (title.toLowerCase().includes('captcha')) {
        throw new Error('CAPTCHA detected');
      }

      const webdriver = await page.evaluate(() => (navigator as any).webdriver);
      if (webdriver) {
        throw new Error('Automation detected');
      }
    } catch (error) {
      if (attempt >= maxAttempts) throw error;

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 60000);
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.navigateWithRetry(page, url, attempt + 1);
    }
  }

  private async extractBusinessData(page: Page): Promise<Record<string, unknown>> {
    const businessName = await page.locator('h1').first().textContent() ?? '';
    const address = await page.locator('[data-item-id="address"]').first().textContent() ?? '';
    const phone = await page.locator('[data-item-id="phone"]').first().textContent() ?? '';

    const hours: Record<string, string> = {};
    const hoursRows = page.locator('[data-item-id="oh"] .fontBodyMedium');
    for (let i = 0; i < await hoursRows.count(); i += 2) {
      const day = await hoursRows.nth(i).textContent() ?? '';
      const time = await hoursRows.nth(i + 1).textContent() ?? '';
      if (day && time) hours[day.trim()] = time.trim();
    }

    const reviews: Array<Record<string, unknown>> = [];
    const reviewCards = page.locator('.review-content');
    for (let i = 0; i < Math.min(await reviewCards.count(), 160); i++) {
      const card = reviewCards.nth(i);
      const author = await card.locator('.section-review-title').textContent() ?? '';
      const ratingStr = await card.locator('.section-review-star-rating').getAttribute('aria-label') ?? '';
      const rating = parseInt(ratingStr.replace(/\D/g, ''), 10);
      const text = await card.locator('.section-review-text').textContent() ?? '';
      const date = await card.locator('.section-review-publish-date').textContent() ?? '';

      reviews.push({ author, rating, text, date });
    }

    const ratingStr = await page.locator('[data-item-id="rating"] .section-star-rating').getAttribute('aria-label') ?? '';
    const rating = parseFloat(ratingStr.replace(/[^0-9.]/g, ''));

    return {
      businessName: businessName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      hours,
      reviews,
      rating: isNaN(rating) ? undefined : rating,
      resultsCount: reviews.length,
    };
  }

  protected async parseHtml(html: string, metadata: Record<string, unknown>): Promise<RawScrapeData> {
    throw new Error('Not used - scraper uses live page navigation');
  }

  protected getValidationSchema() {
    return GoogleMapsSchema;
  }
}

export const googleMapsScraper = new GoogleMapsScraper();
