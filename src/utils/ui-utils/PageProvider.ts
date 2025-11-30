/**
 * ============================================================================
 * PageProvider Utility
 * ----------------------------------------------------------------------------
 * Provides a centralized static access point for the Playwright `Page` object
 * across the test framework. 
 * 
 * This is useful when POMs or helpers need access to the page without passing it
 * explicitly through every function or class constructor.
 * 
 * Implements safety checks to prevent access before initialization.
 * ============================================================================
 */
import { Page } from "@playwright/test";

/** Holds the current Playwright Page instance (or null if uninitialized) */
let currentPage: Page | null = null;

/**
 * ============================================================================
 * PageProvider
 * ----------------------------------------------------------------------------
 * Static helper class to manage a shared Playwright Page instance.
 * ============================================================================
 */
export class PageProvider {

  /**
   * Sets the current Page instance for static access.
   *
   * @param {Page} page - The Playwright Page object to register
   */
  static setPage(page: Page) {
    currentPage = page;
  }

  /**
   * Retrieves the current registered Page instance.
   *
   * @throws {Error} If accessed before initialization
   * @returns {Page} Playwright Page object
   */
  static get page(): Page {
    if (!currentPage) {
      throw new Error("PageProvider.page accessed before being initialized.");
    }
    return currentPage;
  }

  /**
   * Clears the current Page instance from memory.
   * Useful for test teardown to prevent leaking state between tests.
   */
  static clear() {
    currentPage = null;
  }
}