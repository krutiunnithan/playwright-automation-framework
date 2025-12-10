/**
 * ====================================================================
 * Session utils
 * ----------------------------------------------------------------------------
 * Per-worker StorageState helpers for Playwright sessions.
 *
 * - Creates `.auth/` directory if missing
 * - Exposes functions to compute per-worker storage file path
 * - Load-check-save helpers for storage state
 * - Validates session metadata (profile name, username) to prevent session hijacking
 * ====================================================================
 */

import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.resolve(process.cwd(), '.auth');

/**
 * Return worker index from Playwright environment variables.
 * Playwright sets PLAYWRIGHT_WORKER_INDEX. Fallback to 0 if missing.
 */
export function getWorkerIndex(): number {
    const idx = process.env.PLAYWRIGHT_WORKER_INDEX ?? process.env.PW_WORKER_INDEX ?? '0';
    const parsed = parseInt(idx, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Return storage state path for a given profile and current worker.
 * Examples:
 *   .auth/casemanager-worker0.json
 *   .auth/systemadmin-worker1.json
 */
export function storageStatePathFor(profileName: string, workerIndex?: number, userId?: string | number): string {
    const idx = typeof workerIndex === 'number' ? workerIndex : getWorkerIndex();
    // Normalize profile name to a compact filename
    const base = profileName.replace(/\s+/g, '').toLowerCase();
    const userSuffix = userId !== undefined ? `-u${String(userId)}` : '';
    const fileName = `${base}-worker${idx}${userSuffix}.json`;
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    return path.join(AUTH_DIR, fileName);
}

/**
 * Check whether storageState file exists and has a reasonable size.
 */
export function storageStateExists(profileName: string, workerIndex?: number): boolean {
    const p = storageStatePathFor(profileName, workerIndex);
    try {
        const stat = fs.statSync(p);
        return stat.isFile() && stat.size > 100; // small heuristic: >100 bytes
    } catch (err) {
        return false;
    }
}



/**
 * Load and parse storageState JSON if present. Returns parsed object or null.
 */
export function loadStorageState(profileName: string, workerIndex?: number): any | null {
    const p = storageStatePathFor(profileName, workerIndex);
    try {
        if (!fs.existsSync(p)) return null;
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        return null;
    }
}

/**
 * Apply a saved storage state into the provided page's context.
 * - Validates metadata (profileName) to ensure the session belongs to the expected profile
 * - Adds cookies via context.addCookies
 * - Restores localStorage for each origin by opening a temporary page to that origin and setting items
 *
 * Returns true when state was applied, false otherwise.
 */
export async function applyStorageState(page: Page, profileName: string, workerIndex?: number): Promise<boolean> {
    const state = loadStorageState(profileName, workerIndex);
    if (!state) return false;

    // CRITICAL: Validate metadata to prevent session hijacking
    // If file was saved with metadata, verify the profile name matches
    if (state.metadata && state.metadata.profileName) {
        const normalizedExpected = profileName.replace(/\s+/g, '').toLowerCase();
        const normalizedStored = state.metadata.profileName.replace(/\s+/g, '').toLowerCase();

        if (normalizedStored !== normalizedExpected) {
            console.warn(
                `[SessionUtils] SECURITY: Profile mismatch detected!` +
                ` Session is for '${state.metadata.profileName}' but trying to load for '${profileName}'.` +
                ` Rejecting session to prevent unauthorized access.`
            );
            return false;
        }
    }

    const context = page.context();

    // Apply cookies (Playwright expects cookies in the same shape as storageState.cookies)
    if (Array.isArray(state.cookies) && state.cookies.length > 0) {
        try {
            await context.addCookies(state.cookies);
        } catch (err) {
            // ignore and continue
        }
    }

    // Apply localStorage for each origin by opening a short-lived page to that origin
    if (Array.isArray(state.origins) && state.origins.length > 0) {
        for (const o of state.origins) {
            try {
                const originUrl = o.origin;
                const items = Array.isArray(o.localStorage) ? o.localStorage : [];
                if (!originUrl || items.length === 0) continue;

                const temp = await context.newPage();
                // navigate to the origin so localStorage is associated with that origin
                await temp.goto(originUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => { });
                for (const kv of items) {
                    try {
                        const name = kv.name;
                        const value = kv.value;
                        await temp.evaluate(([k, v]) => localStorage.setItem(k, v), [name, value]);
                    } catch (e) {
                        // ignore single item failures
                    }
                }
                await temp.close();
            } catch (e) {
                // ignore origin-level failures and continue
            }
        }
    }

    return true;
}


/**
 * Save storageState with metadata for validation.
 * 
 * Stores:
 *   - Playwright's standard storageState (cookies, origins, localStorage)
 *   - Custom metadata: profileName, username, timestamp, workerIndex
 * 
 * This metadata is used by applyStorageState() to validate that a session
 * belongs to the expected profile, preventing unauthorized session reuse.
 */
export async function saveStorageState(
    page: Page,
    profileName: string,
    workerIndex?: number,
    username?: string
): Promise<string> {
    const p = storageStatePathFor(profileName, workerIndex);

    // Get Playwright's standard storageState
    const state = await page.context().storageState();

    // Enrich with metadata for validation
    const enrichedState = {
        ...state,
        metadata: {
            profileName,  // CRITICAL: Used to validate during applyStorageState()
            username,
            savedAt: new Date().toISOString(),
            workerIndex: typeof workerIndex === 'number' ? workerIndex : getWorkerIndex()
        }
    };

    fs.writeFileSync(p, JSON.stringify(enrichedState, null, 2));
    return p;
}

/**
 * Delete storage file - useful if it's known-bad or expired.
 */
export function deleteStorageState(profileName: string, workerIndex?: number): void {
    const p = storageStatePathFor(profileName, workerIndex);
    try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (err) {
        // ignore
    }
}