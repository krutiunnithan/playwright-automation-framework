import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config(); // load .env

// Map environment to URL
const env = process.env.TEST_ENVIRONMENT_VALUE || 'dev';
const BASE_URLS: Record<string, string> = {
  dev: 'https://orgfarm-eefdb34c0a-dev-ed.develop.my.salesforce.com',
  sit: 'https://orgfarm-eefdb34c0a-sit-ed.develop.my.salesforce.com',
  uat: 'https://orgfarm-eefdb34c0a-uat-ed.develop.my.salesforce.com',
};

const baseURL = BASE_URLS[env.toLowerCase()]

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  testDir: './src/tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  //reporter: [['html', {open:'always'}]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    //trace: 'on-first-retry',
    //screenshot:'on',
    //video:'retain-on-failure',
    headless:false,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testMatch: [
        'ui-tests/**/*.spec.ts',       
        'ui-api-tests/**/*.spec.ts'    
      ],
      use: { ...devices['Desktop Chrome'],
        baseURL, 
       },
    },

    {
      name: 'firefox',
      testMatch: [
        'ui-tests/**/*.spec.ts',       
        'ui-api-tests/**/*.spec.ts'    
      ],
      use: { ...devices['Desktop Firefox'], 
        baseURL, 
       },
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
