import { CasePage } from '@pages/CasePage';
import { ContactPage } from '@pages/ContactPage';
import { LoginPage } from '@pages/LoginPage';
import { expect } from '@playwright/test';
import path from 'path';


import { PageProvider } from '@utils/ui-utils/PageProvider';
import { test as baseWorkerTest } from './worker-context';


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

    const relativePath = path.relative(
      path.resolve(__dirname, '../tests'),
      testInfo.file
    );
    const segments = relativePath.split(path.sep);
    const moduleFolder = segments[1];

    if (moduleFolder === 'contact-module-tests') {
      loginPage.setModuleType('contact');
    } else if (moduleFolder === 'case-module-tests') {
      loginPage.setModuleType('case');
    } else {
      loginPage.setModuleType('login');
    }

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

test.beforeEach(async ({ workerPage }, testInfo) => {
  PageProvider.setPage(workerPage);

  // Clear old session files from previous workers (not current worker)
  // This prevents device identification issues
  const fs = await import('fs');
  const path = await import('path');
  const authDir = path.join(process.cwd(), '.auth');

  try {
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      files.forEach(file => {
        // Only delete sessions from OTHER workers, keep current worker's session
        if (!file.includes(`worker${testInfo.workerIndex}`)) {
          fs.unlinkSync(path.join(authDir, file));
          console.log(`[beforeEach] Cleared stale session: ${file}`);
        }
      });
    }
  } catch (_) {
    // ignore
  }


  const salesforceOrgUrl = process.env.SALESFORCE_ORG_URL || 'https://orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com';
  console.log(`[beforeEach] Navigating to ${salesforceOrgUrl}`);
  await workerPage.goto(salesforceOrgUrl, { waitUntil: 'domcontentloaded' });
});

test.afterEach(async ({ workerPage }, testInfo) => {
  if (testInfo.status !== 'passed') {
    const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
    console.log(`[afterEach] Test failed, capturing screenshot: ${screenshotPath}`);
    await workerPage.screenshot({ path: screenshotPath }).catch(() => { });
  }
});

export { expect };