import { test as base, Page, chromium, firefox, webkit } from '@playwright/test';
import type { Browser, BrowserContext } from 'playwright';

const workerBrowsers = new Map<number, Browser>();
const workerContexts = new Map<number, BrowserContext>();

export type WorkerFixtures = {
  workerPage: Page;
};

export const test = base.extend<WorkerFixtures>({
  workerPage: async ({ }, use, testInfo) => {
    const workerIndex = testInfo.workerIndex;

    let browser = workerBrowsers.get(workerIndex);
    if (!browser) {
      browser = await chromium.launch({ headless: false });
      workerBrowsers.set(workerIndex, browser);
    }

    let context = workerContexts.get(workerIndex);
    if (!context) {
      context = await browser.newContext();
      workerContexts.set(workerIndex, context);
    }

    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    // This blocks until test completely finishes
    await use(page);

    // After use() returns, page is still open
    // Wait 5 seconds to ensure all async operations finish
    await new Promise(resolve => setTimeout(resolve, 5000));

    // NOW close
    await page.close().catch(() => { });
  },
});

export async function closeWorkerContexts() {
  for (const [workerIndex, context] of workerContexts.entries()) {
    console.log(`[Worker ${workerIndex}] Closing persistent context`);
    await context.close();
  }
  for (const [workerIndex, browser] of workerBrowsers.entries()) {
    console.log(`[Worker ${workerIndex}] Closing browser`);
    await browser.close();
  }
  workerBrowsers.clear();
  workerContexts.clear();
}