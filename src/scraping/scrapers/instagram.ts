import { Browser, Page } from 'playwright-extra';
import { BaseScraper, RawScrapeData } from './base';
import { InstagramSchema } from '../validation/schemas';
import { createStealthContext, createStealthBrowser } from '../stealth/context-builder';

export class InstagramScraper extends BaseScraper {
  readonly source: 'instagram' = 'instagram';

  private browser: Browser | null = null;

  async scrape(businessId: string, url: string): Promise<RawScrapeData> {
    if (!this.browser) {
      this.browser = await createStealthBrowser();
    }

    const context = await createStealthContext(this.browser, {
      source: 'instagram',
      randomize: false,
    });

    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const isLoginWall = await page.locator('input[name="username"]').isVisible().catch(() => false);
      if (isLoginWall) {
        throw new Error('Instagram requires login - authenticated sessions not yet implemented');
      }

      const data = await this.extractProfileData(page);
      await context.close();

      return this.createRawScrapeData(businessId, url, data);
    } catch (error) {
      await context.close();
      throw error;
    }
  }

  private async extractProfileData(page: Page): Promise<Record<string, unknown>> {
    const profileName = await page.locator('header h1').first().textContent() ?? '';
    const bio = await page.locator('header span').first().textContent() ?? '';

    const counts = await page.locator('header ul li').allTextContents();
    const followers = parseFollowCount(counts.find(c => c.includes('followers')) ?? '0');
    const following = parseFollowCount(counts.find(c => c.includes('following')) ?? '0');

    const posts: Array<Record<string, unknown>> = [];
    const postLinks = page.locator('article a');
    const postCount = await postLinks.count();

    for (let i = 0; i < Math.min(postCount, 50); i++) {
      const postPage = await this.browser!.newPage();
      try {
        const href = await postLinks.nth(i).getAttribute('href');
        if (!href) continue;

        await postPage.goto(`https://www.instagram.com${href}`, { waitUntil: 'networkidle' });

        const likesStr = await postPage.locator('section span a span').first().textContent() ?? '0';
        const likes = parseEngagementCount(likesStr);
        const comments = await postPage.locator('ul li').count();

        // Extract shares - look for share button with count
        const sharesEl = postPage.locator('[aria-label*="share"], [aria-label*="Share"]').first();
        const sharesText = await sharesEl.textContent().catch(() => '0');
        const shares = parseEngagementCount(sharesText || '0');

        const engagement = likes + comments + shares;

        posts.push({
          id: href.split('/')[2] ?? '',
          likes,
          comments,
          shares,
          engagement,
          caption: await postPage.locator('li span span').first().textContent().catch(() => ''),
          postedAt: '',
        });
      } finally {
        await postPage.close();
      }
    }

    // Sort by engagement descending (SCRAPE-02)
    posts.sort((a, b) => (b.engagement as number) - (a.engagement as number));

    return {
      profileName: profileName.trim(),
      bio: bio.trim(),
      followers,
      following,
      posts,
    };
  }

  protected async parseHtml(html: string, metadata: Record<string, unknown>): Promise<RawScrapeData> {
    throw new Error('Not used');
  }

  protected getValidationSchema() {
    return InstagramSchema;
  }
}

function parseFollowCount(text: string): number {
  const match = text.match(/([\d.,]+)/);
  if (!match) return 0;
  const num = match[1].replace(/,/g, '');
  if (num.includes('k')) return parseFloat(num) * 1000;
  if (num.includes('m')) return parseFloat(num) * 1000000;
  return parseInt(num, 10);
}

function parseEngagementCount(text: string): number {
  const match = text.replace(/,/g, '').match(/([\d.]+)/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

export const instagramScraper = new InstagramScraper();
