import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
} from 'playwright';

import { chromium, devices } from 'playwright';
import { test as base } from 'vitest';

import { IS_PROD } from './example';
import { expect } from './expect';
import { fileURLToPath } from 'node:url';

type Fixtures = {
  $file: {
    browser: Browser;
  };
  $test: {
    allowHydrationMismatch: boolean;
    baseURL: string;
    context: BrowserContext;
    page: Page;
  };
};

// The context defaults `@playwright/test` applies on top of the library's.
const CONTEXT_DEFAULTS: BrowserContextOptions = {
  acceptDownloads: true,
  colorScheme: 'light',
  contrast: 'no-preference',
  forcedColors: 'none',
  locale: 'en-US',
  reducedMotion: 'no-preference',
  serviceWorkers: 'allow',
};

const HYDRATION_MISMATCH_PREFIX = 'Hydration failed';

const TEST_RESULTS_URL = new URL('../test-results/', import.meta.url);

function toTracePath(name: string): string {
  const slug = name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return fileURLToPath(new URL(`${slug}/trace.zip`, TEST_RESULTS_URL));
}

export const test = base.extend<Fixtures>({
  allowHydrationMismatch: false,
  baseURL: '',
  browser: [
    // biome-ignore lint/correctness/noEmptyPattern: yap yap yap
    async ({}, use) => {
      const browser = await chromium.launch({
        handleSIGINT: false,
      });
      await use(browser);
      await browser.close();
    },
    {
      scope: 'file',
    },
  ],
  context: async ({ baseURL, browser, task }, use) => {
    if (baseURL === '') {
      throw new Error('baseURL is required');
    }
    const context = await browser.newContext({
      ...CONTEXT_DEFAULTS,
      ...devices['Desktop Chrome'],
      baseURL,
      timezoneId: 'Europe/Stockholm',
    });
    // Mirrors Playwright's `trace: 'on-first-retry'`.
    const isFirstRetry = task.result?.retryCount === 1;
    if (isFirstRetry) {
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });
    }
    try {
      await use(context);
    } finally {
      if (isFirstRetry) {
        await context.tracing.stop({
          path: toTracePath(task.fullName),
        });
      }
      await context.close();
    }
  },
  page: async ({ allowHydrationMismatch, context }, use) => {
    const page = await context.newPage();
    const errors: string[] = [];
    const record = (text: string): void => {
      if (
        allowHydrationMismatch &&
        text.startsWith(HYDRATION_MISMATCH_PREFIX)
      ) {
        return;
      }
      errors.push(text);
    };
    page.on('pageerror', (error) => {
      record(error.message);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        record(message.text());
        return;
      }
      if (IS_PROD && message.text().includes('[yapyak]')) {
        errors.push(message.text());
      }
    });
    await use(page);
    expect(errors).toEqual([]);
  },
});

export { expect };
