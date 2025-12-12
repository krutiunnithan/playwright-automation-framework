/**
 * ============================================================================
 * Worker Context Fixtures
 * ============================================================================
 * Manages per-worker browser instances and contexts for parallel test execution.
 * Ensures isolated browser environments across multiple workers.
 */

import { test as base, chromium, Page } from '@playwright/test';
import type { Browser, BrowserContext } from 'playwright';

const workerBrowsers = new Map<number, Browser>();
const workerContexts = new Map<number, BrowserContext>();

export type WorkerFixtures = {
  workerPage: Page;
};

export const test = base.extend<WorkerFixtures>({
  workerPage: async ({ }, use, testInfo) => {
    const workerIndex = testInfo.workerIndex;

    // Browser config driven from playwright.config.ts
    // headless mode is set in config, but can be read from context
    let browser = workerBrowsers.get(workerIndex);
    if (!browser) {
      // Launch based on config headless setting
      browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true' ? true : false,
      });
      workerBrowsers.set(workerIndex, browser);
    }

    // Per-worker persistent context (session reuse across tests)
    let context = workerContexts.get(workerIndex);
    if (!context) {
      context = await browser.newContext();
      workerContexts.set(workerIndex, context);
    }

    // Fresh page for each test
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    // Page used during test execution
    await use(page);

    // Cleanup: Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Close only the page (context and browser persist for next test)
    await page.close().catch(() => { });
  },
});

//  Global cleanup when all tests complete
export async function closeWorkerContexts() {

  for (const [workerIndex, context] of workerContexts.entries()) {
    await context.close().catch(() => { });
  }

  for (const [workerIndex, browser] of workerBrowsers.entries()) {
    await browser.close().catch(() => { });
  }

  workerBrowsers.clear();
  workerContexts.clear();
}

