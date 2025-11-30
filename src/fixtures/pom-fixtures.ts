/**
 * ============================================================================
 * Playwright POM Fixture Configuration
 * ----------------------------------------------------------------------------
 * Central fixture provider for:
 *  - Initializing Page Object Model (POM) classes
 *  - Providing globally accessible `page` instance
 *  - Managing automatic navigation for UI test suites
 *
 * This file acts as the dependency injection (DI) layer for all UI tests.
 * ============================================================================
 */
import { test as base, expect, Page, TestInfo } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { ContactPage } from '@pages/ContactPage';
import path from 'path';
import { PageProvider } from '@utils/ui-utils/PageProvider';


/**
 * ----------------------------------------------------------------------------
 * Fixture Types
 * ----------------------------------------------------------------------------
 * Defines which POMs (Page Objects) will be injected into the test context.
 */
type PomFixtures = {
  loginPage: LoginPage;
  contactPage: ContactPage;
};


/**
 * ----------------------------------------------------------------------------
 * Extended Playwright Test Object
 * ----------------------------------------------------------------------------
 * Adds POM fixtures to the default Playwright test object.
 */
export const test = base.extend<PomFixtures>({

  /**
   * ==========================================================================
   * Page Fixture
   * ==========================================================================
   * Responsibilities:
   *  - Provide a single shared Playwright `page` object
   *  - Register the page into PageProvider for global static access
   *  - Ensure cleanup after each test
   *
   * @param page - Playwright's native Page object
   * @param use  - Callback that exposes the fixture to the test
   */
  page: async ({ page }, use) => {

    // Register the active Playwright page globally
    PageProvider.setPage(page);

    // Inject page to tests
    await use(page);

    // Cleanup to avoid leaking state across tests
    PageProvider.clear();
  },


  /**
   * ==========================================================================
   * Login Page Fixture
   * ==========================================================================
   * Provides a ready-to-use LoginPage instance for each test.
   *
   * @param page - Playwright page instance
   * @param use  - Exposes the fixture to test bodies
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },


  /**
   * ==========================================================================
   * Contact Page Fixture
   * ==========================================================================
   * Provides a ready-to-use ContactPage instance.
   *
   * @param page - Playwright page instance
   * @param use  - Exposes the fixture to test bodies
   */
  contactPage: async ({ page }, use) => {
    const contactPage = new ContactPage(page);
    await use(contactPage);
  },
});


/**
 * ----------------------------------------------------------------------------
 * Global BeforeEach Hook
 * ----------------------------------------------------------------------------
 * Purpose:
 *  - Automatically navigate to base URL before UI tests
 *  - Avoids repetitive `page.goto('/')` inside each test file
 *
 * Logic:
 *  - Detects the top-level test folder (ui-tests / ui-api-tests)
 *  - Only auto-navigates for UI-driven suites
 *
 * @param page - Playwright Page instance
 * @param testInfo - Metadata about the currently running test
 */
test.beforeEach(async ({ page }, testInfo) => {

  // Determine relative test folder (e.g., ui-tests/, api-tests/, etc.)
  const relativePath = path.relative(path.resolve(__dirname, '../tests'), testInfo.file);

  // Split into path segments
  const segments = relativePath.split(path.sep);

  // The first segment is the top-level folder under tests
  const topFolder = segments[0];

  // Auto-navigate for UI-focused test suites
  if (topFolder === 'ui-tests' || topFolder === 'ui-api-tests') {
    await page.goto('/');
  }
});


export { expect };