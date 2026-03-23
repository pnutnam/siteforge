import { chromium, Browser, BrowserContext } from 'playwright-extra';
import { faker } from '@faker-js/faker';

// ---------------------------------------------------------------------------
// Detection signals that trigger retry (SCRAPE-07)
// ---------------------------------------------------------------------------
export const DETECTION_SIGNALS = {
  isNon200Response: (response: { status(): number }) => response.status() !== 200,
  isCaptchaPage: (url: string, title: string) =>
    url.includes('captcha') || title.toLowerCase().includes('captcha'),
  isUnexpectedRedirect: (url: string, expectedDomains: string[]) =>
    !expectedDomains.some(domain => url.includes(domain)),
  hasAutomationIndicators: (page: { evaluate(): Promise<{ webdriver?: unknown; chrome?: unknown; permissions?: unknown }> }) =>
    page.evaluate(() => {
      return {
        webdriver: (navigator as any).webdriver,
        chrome: (window as any).chrome,
        permissions: (navigator as any).permissions?.query,
      };
    }),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SourceType = 'google_maps' | 'instagram' | 'facebook' | 'yelp' | 'google_reviews';

export interface StealthContextParams {
  source: SourceType;
  randomize?: boolean; // If true, use randomized fingerprints per request
}

export interface StealthConfig {
  viewport: { width: number; height: number };
  timezone: string;
  locale: string;
  userAgent: string;
}

// ---------------------------------------------------------------------------
// Source-specific stealth configurations (per research and user decisions)
// ---------------------------------------------------------------------------
export const SOURCE_STEALTH_CONFIG: Record<SourceType, StealthConfig> = {
  google_maps: {
    viewport: { width: 1280, height: 720 },
    timezone: 'America/New_York',
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  instagram: {
    viewport: { width: 390, height: 844 }, // iPhone mobile
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  facebook: {
    viewport: { width: 1366, height: 768 },
    timezone: 'America/Chicago',
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  yelp: {
    viewport: { width: 1440, height: 900 }, // MacBook Pro
    timezone: 'America/New_York',
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  google_reviews: {
    viewport: { width: 1280, height: 720 },
    timezone: 'America/New_York',
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
};

// ---------------------------------------------------------------------------
// Create stealth browser (shared across contexts)
// ---------------------------------------------------------------------------
/**
 * Create a headless browser with stealth plugin loaded.
 * The browser is reused across multiple scrape requests.
 */
export async function createStealthBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });
}

// ---------------------------------------------------------------------------
// Create stealth context per request
// ---------------------------------------------------------------------------
/**
 * Create a new browser context with randomized fingerprints.
 * Each context gets a fresh set of fingerprints to avoid detection.
 */
export async function createStealthContext(
  browser: Browser,
  params: StealthContextParams
): Promise<BrowserContext> {
  const sourceConfig = SOURCE_STEALTH_CONFIG[params.source];

  // Use randomized fingerprints if requested, otherwise use source defaults
  const config: StealthConfig = params.randomize
    ? {
        viewport: {
          width: faker.number.int({ min: 1024, max: 1920 }),
          height: faker.number.int({ min: 768, max: 1080 }),
        },
        timezone: faker.location.timeZone(),
        locale: faker.location.locale(),
        userAgent: faker.internet.userAgent(),
      }
    : sourceConfig;

  const context = await browser.newContext({
    viewport: config.viewport,
    locale: config.locale,
    timezoneId: config.timezone,
    userAgent: config.userAgent,
    // Block resources that leak automation signals
    serviceWorkers: 'block',
  });

  // Additional stealth: inject script to hide automation properties
  await context.addInitScript(() => {
    // Hide webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Hide Chrome runtime
    (window as any).chrome = { runtime: {} };

    // Mock permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission } as any)
        : originalQuery(parameters);
  });

  return context;
}
