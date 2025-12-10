import { AppRoutes } from '@data/constants/app-routes';
import { Page } from '@playwright/test';
import * as SessionUtils from '@utils/session-utils';

/**
 * ============================================================================
 * LoginUtil - Login Helper Utilities
 * ============================================================================
 * Reusable utilities for login operations (session management, delays, validation).
 * All methods are static and thread-safe for parallel execution.
 */
export class LoginUtil {
    /**
     * Apply stagger delay based on worker index to prevent rate limiting
     * Worker 0: 0ms, Worker 1: 15000ms, Worker 2: 30000ms (configurable via STAGGER_DELAY_MS)
     */
    static async applyStaggerDelay(workerIndex: number): Promise<void> {
        const delayPerWorkerMs = parseInt(process.env.STAGGER_DELAY_MS || '15000', 10);
        const normalizedWorkerIndex = workerIndex % 3;
        const totalDelayMs = normalizedWorkerIndex * delayPerWorkerMs;

        if (totalDelayMs > 0) {
            const delaySeconds = Math.round(totalDelayMs / 1000);
            console.log(
                `[LoginUtil] Applying stagger delay: ${delaySeconds}s for worker ${workerIndex} (normalized: ${normalizedWorkerIndex})`
            );
            await new Promise((resolve) => setTimeout(resolve, totalDelayMs));
        }
    }

    /**
     * Check if session is valid by verifying profile button visibility
     */
    static async isSessionValid(profileButton: any): Promise<boolean> {
        try {
            await profileButton.waitFor({ state: 'visible', timeout: 5_000 });
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Attempt to reuse existing session storage state
     * Returns true if session was successfully reused, false otherwise
     */
    static async tryReuseStorage(
        page: Page,
        profileButton: any,
        profile: string,
        workerIndex: number
    ): Promise<boolean> {
        const exists = SessionUtils.storageStateExists(profile, workerIndex);
        if (!exists) return false;

        try {
            const applied = await SessionUtils.applyStorageState(
                page,
                profile,
                workerIndex
            );
            if (!applied) {
                console.log(`[LoginUtil] Session file exists but cannot be reused, proceeding with fresh login`);
                return false;
            }

            await page.goto(AppRoutes.HOME, { waitUntil: 'domcontentloaded' });

            let currentUrl = page.url();
            if (currentUrl.includes('developer-edition') || currentUrl.includes('/setup')) {
                console.log(`[LoginUtil] Session redirected to setup page, session may be stale`);
                SessionUtils.deleteStorageState(profile, workerIndex);
                return false;
            }

            const isValid = await LoginUtil.isSessionValid(profileButton);
            if (!isValid) {
                console.log(
                    `⚠️  [LoginUtil] Session exists but is stale (user logged out), clearing...`
                );
                SessionUtils.deleteStorageState(profile, workerIndex);
                return false;
            }

            try {
                await page.locator('.slds-scope').waitFor({ state: 'visible', timeout: 5_000 });
            } catch (_) {
                console.log(`[LoginUtil] Lightning UI load delayed, continuing...`);
            }

            console.log(
                `✓ [LoginUtil] Reused VALID session for worker ${workerIndex}`
            );
            return true;
        } catch (err) {
            console.log(`[LoginUtil] Error during session reuse: ${err}`);
            return false;
        }
    }
}