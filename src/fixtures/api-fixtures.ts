/**
 * ============================================================================
 * API Test Fixtures
 * ============================================================================
 * Provides authenticated API client for tests.
 * Uses Client Credentials OAuth2 Flow.
 * Works for both local and CI/CD (parallel-safe).
 */

import { test as base } from '@playwright/test';
import { SalesforceApiClient } from '@utils/api-utils/SalesforceApiClient';

type ApiFixtures = {
    apiClient: SalesforceApiClient;
};

export const test = base.extend<ApiFixtures>({
    apiClient: async ({ }, use) => {
        try {
            // Create authenticated API client (Client Credentials OAuth2)
            const client = await SalesforceApiClient.create();

            // Provide client to test
            await use(client);
        } catch (err) {
            throw new Error(
                `Failed to create API client: ${err instanceof Error ? err.message : String(err)}`
            );
        }
    },
});

export { expect } from '@playwright/test';