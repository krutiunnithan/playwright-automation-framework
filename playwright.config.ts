import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

// ✅ Environment mapping
const env = process.env.TEST_ENVIRONMENT_VALUE || 'dev';

const TEST_TIMEOUT_MS = parseInt(process.env.TEST_TIMEOUT_MS || '180000', 10); // 3 min default
const OTP_TIMEOUT_MS = parseInt(process.env.OTP_FETCH_TIMEOUT_MS || '120000', 10); // 2 min default

// ✅ Separate baseURLs for UI and API
const BASE_URLS: Record<string, { ui: string; api: string }> = {
  dev: {
    ui: 'https://orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com',  
    api: 'https://orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com/services/data/v60.0',  
  },
  sit: {
    ui: 'https://sit-orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com', 
    api: 'https://sit-orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com/services/data/v60.0',  
  },
  uat: {
    ui: 'https://uat-orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com',  
    api: 'https://uat-orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com/services/data/v60.0',  
  },
};

const urls = BASE_URLS[env.toLowerCase()] || BASE_URLS['dev'];

export default defineConfig({
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  testDir: './src/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: TEST_TIMEOUT_MS, 
  
  // ✅ Workers from config or env
  workers: process.env.CI ? 3 : (process.env.WORKERS ? parseInt(process.env.WORKERS) : 3),
  
  reporter: [
    ['html', { open: 'always' }],
    ['list'],
  ],

  // ✅ Shared settings
  use: {
    headless: process.env.HEADLESS === 'true' ? true : false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ✅ Separate projects for UI and API
  projects: [
    {
      name: 'chromium-ui-tests',
      testMatch: 'ui-tests/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.ui, 
      },
    },

    {
      name: 'chromium-api-tests',
      testMatch: 'api-tests/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.api, 
      },
    },

    {
      name: 'chromium-ui-api-tests',
      testMatch: 'ui-api-tests/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.ui,  
      },
    },

    // Firefox projects 
    // {
    //   name: 'firefox-ui-tests',
    //   testMatch: 'ui-tests/**/*.spec.ts',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     baseURL: urls.ui,
    //   },
    // },
    // {
    //   name: 'firefox-api-tests',
    //   testMatch: 'api-tests/**/*.spec.ts',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     baseURL: urls.api,
    //   },
    // },
  ],
});