// src/fixtures/pom-fixtures.ts
import { test as base, expect, Page, TestInfo } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import path from 'path';
import { PageProvider } from '@utils/ui-utils/PageProvider';

type PomFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<PomFixtures>({

  page: async ({ page }, use) => {
  PageProvider.setPage(page);
  await use(page);
  PageProvider.clear();   // safety after test
},

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

test.beforeEach(async ({ page }, testInfo ) => {
  // Get relative path from 'tests' folder
  const relativePath = path.relative(path.resolve(__dirname, '../tests'), testInfo.file);

  // Split into path segments
  const segments = relativePath.split(path.sep);

  // The first segment is the top-level folder under tests
  const topFolder = segments[0];
  if (topFolder === 'ui-tests' || topFolder === 'ui-api-tests') {
    await page.goto('/'); 
  }
});

export { expect };