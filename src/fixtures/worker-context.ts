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
    // headless mode is set in config, but we can read it from context
    let browser = workerBrowsers.get(workerIndex);
    if (!browser) {
      // Launch based on config headless setting
      browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true' ? true : false,
      });
      workerBrowsers.set(workerIndex, browser);
      console.log(`[Worker ${workerIndex}] Launched Chromium (headless: ${process.env.HEADLESS === 'true'})`);
    }

    // Per-worker persistent context (session reuse across tests)
    let context = workerContexts.get(workerIndex);
    if (!context) {
      context = await browser.newContext();
      workerContexts.set(workerIndex, context);
      console.log(`[Worker ${workerIndex}] Created persistent context`);
    }

    // Fresh page for each test
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log(`[Worker ${workerIndex}] Created new page for test`);

    // Page used during test (blocks here)
    await use(page);

    // Cleanup: Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Close only the page (context and browser persist for next test)
    await page.close().catch(() => { });
    console.log(`[Worker ${workerIndex}] Closed page`);
  },
});

//  Global cleanup when all tests complete
export async function closeWorkerContexts() {

  console.log('[Worker] Closing all worker resources...');

  for (const [workerIndex, context] of workerContexts.entries()) {
    console.log(`[Worker ${workerIndex}] Closing persistent context`);
    await context.close().catch(() => { });
  }

  for (const [workerIndex, browser] of workerBrowsers.entries()) {
    console.log(`[Worker ${workerIndex}] Closing browser`);
    await browser.close().catch(() => { });
  }

  workerBrowsers.clear();
  workerContexts.clear();
  console.log('[Worker] All resources closed');
}

