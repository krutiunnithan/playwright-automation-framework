import { Page } from '@playwright/test';

/**
 * ============================================================================
 * Page Provider - Global Singleton
 * ============================================================================
 * Provides async-safe access to the current page for a test.
 */
class PageProvider {
  private static currentPage: Page | null = null;

  /**
   * Set the page for the current test
   */
  static setPage(page: Page): void {
    this.currentPage = page;
  }

  /**
   * Get the current page
   * Returns page if set, throws error if not
   */
  static async getPage(timeoutMs: number = 10000): Promise<Page> {
    const startTime = Date.now();

    // Wait for page to be set (up to timeoutMs)
    while (!this.currentPage) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`PageProvider: Page not set within ${timeoutMs}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.currentPage;
  }

  /**
   * Clear the page reference
   */
  static clear(): void {
    this.currentPage = null;
  }
}

export { PageProvider };

