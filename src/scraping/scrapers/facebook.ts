import { Browser, Page } from 'playwright-extra';
import { BaseScraper, RawScrapeData } from './base';
import { FacebookSchema } from '../validation/schemas';
import { createStealthContext, createStealthBrowser } from '../stealth/context-builder';

export class FacebookScraper extends BaseScraper {
  readonly source: 'facebook' = 'facebook';

  private browser: Browser | null = null;

  async scrape(businessId: string, url: string): Promise<RawScrapeData> {
    if (!this.browser) {
      this.browser = await createStealthBrowser();
    }

    const context = await createStealthContext(this.browser, {
      source: 'facebook',
      randomize: false,
    });

    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const data = await this.extractPageData(page);
      await context.close();

      return this.createRawScrapeData(businessId, url, data);
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  private async extractPageData(page: Page): Promise<Record<string, unknown>> {
    const pageName = await page.locator('h1').first().textContent() ?? '';
    const about = await page.locator('div[data-pagelet="TimelineInformation"]').textContent().catch(() => '');

    const likeText = await page.locator('span:has-text("people like this")').textContent().catch(() => '0');
    const likes = parseFacebookCount(likeText);

    const posts: Array<Record<string, unknown>> = [];
    const postElements = page.locator('[data-ad-preview="message"]');
    const postTimes = page.locator('span[dir="auto"][role="link"]');

    const postCount = await postElements.count();
    for (let i = 0; i < Math.min(postCount, 20); i++) {
      const content = await postElements.nth(i).textContent() ?? '';
      const postedAt = await postTimes.nth(i).textContent().catch(() => '');

      posts.push({
        id: `fb-post-${i}`,
        content: content.trim(),
        likes: 0,
        comments: 0,
        shares: 0,
        postedAt: postedAt.trim(),
      });
    }

    return {
      pageName: pageName.trim(),
      about: about.trim(),
      likes,
      posts,
    };
  }

  protected async parseHtml(html: string, metadata: Record<string, unknown>): Promise<RawScrapeData> {
    throw new Error('Not used');
  }

  protected getValidationSchema() {
    return FacebookSchema;
  }
}

function parseFacebookCount(text: string): number {
  const match = text.match(/([\d.,]+)/);
  if (!match) return 0;
  const num = match[1].replace(/,/g, '');
  if (num.includes('K')) return parseFloat(num) * 1000;
  if (num.includes('M')) return parseFloat(num) * 1000000;
  return parseInt(num, 10);
}

export const facebookScraper = new FacebookScraper();
