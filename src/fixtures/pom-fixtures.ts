import { CasePage } from '@pages/CasePage';
import { ContactPage } from '@pages/ContactPage';
import { LoginPage } from '@pages/LoginPage';
import { expect } from '@playwright/test';
import { releaseUserLockByWorker } from '@utils/aws-utils/UserLock';

import { AppRoutes } from '@data/constants/app-routes';
import { test as baseWorkerTest } from '@fixtures/worker-context';
import { parallelLogger } from '@utils/log-utils/ParallelExecutionLogger';
import { PageProvider } from '@utils/ui-utils/PageProvider';


type PomFixtures = {
  page: any;
  loginPage: LoginPage;
  contactPage: ContactPage;
  casePage: CasePage;
};

export const test = baseWorkerTest.extend<PomFixtures>({
  page: async ({ workerPage }, use) => {
    PageProvider.setPage(workerPage);
    await use(workerPage);
    PageProvider.clear();
  },

  loginPage: async ({ workerPage }, use, testInfo) => {
    const workerIndex = testInfo.workerIndex;
    console.log(
      `[POM-Fixture] Creating LoginPage for worker ${workerIndex} (test: ${testInfo.title})`
    );

    const loginPage = new LoginPage(workerPage, workerIndex);

    await use(loginPage);
  },

  contactPage: async ({ workerPage }, use) => {
    const contactPage = new ContactPage(workerPage);
    await use(contactPage);
  },

  casePage: async ({ workerPage }, use) => {
    const casePage = new CasePage(workerPage);
    await use(casePage);
  },
});

test.beforeEach(async ({ workerPage, baseURL }, testInfo) => {
  try {
    parallelLogger.logTestStart(testInfo.workerIndex, testInfo.title);
    PageProvider.setPage(workerPage);

    // Clear old session files
    const fs = await import('fs');
    const path = await import('path');
    const authDir = path.join(process.cwd(), '.auth');


    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      files.forEach(file => {
        if (!file.includes(`worker${testInfo.workerIndex}`)) {
          fs.unlinkSync(path.join(authDir, file));
          console.log(`[beforeEach] Cleared stale session: ${file}`);
        }
      });
    }


    // Use baseURL from config instead of hardcoded
    console.log(`[beforeEach] Navigating to ${baseURL}`);
    await workerPage.goto(AppRoutes.HOME, { waitUntil: 'domcontentloaded' });
  }
  catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
});

test.afterEach(async ({ workerPage }, testInfo) => {
  try {
    // RELEASE USER LOCK (whether test passed or failed)
    releaseUserLockByWorker(testInfo.workerIndex);
    parallelLogger.logTestEnd(testInfo.workerIndex, testInfo.title, testInfo.status === 'passed' ? 'PASSED' : 'FAILED');


    if (testInfo.status !== 'passed') {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
      console.log(`[afterEach] Test failed, capturing screenshot: ${screenshotPath}`);
      await workerPage.screenshot({ path: screenshotPath }).catch(() => { });
    }

    // Print summary at the end
    if (testInfo.testId.includes('spec.ts')) {
      console.log(parallelLogger.generateSummary());
    }
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
});

export { expect };

