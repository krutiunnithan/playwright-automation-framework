/**
 * ============================================================================
 * BasePage
 * ----------------------------------------------------------------------------
 * Abstract base class for all Page Objects.
 * Provides reusable wrapper methods around Playwright Page and Locator
 * to simplify actions, add default timeouts, retry logic, and screenshots.
 * ============================================================================
 */
import { Locator, Page } from '@playwright/test';


/**
 * ============================================================================
 * BasePage
 * ----------------------------------------------------------------------------
 * @author Kruti Unnithan
 * 
 * @property {Page} page             - Playwright page instance
 * @property {number} defaultTimeout - Default timeout for waits (ms)
 * ============================================================================
 */
export abstract class BasePage {
  protected page: Page;
  protected readonly defaultTimeout = 60_000;


  /**
   * ==========================================================================
   * Constructor
   * @param {Page} page - Playwright page instance
   * ==========================================================================
   */
  constructor(page: Page) {
    this.page = page;
  }


  /**
   * ==========================================================================
   * locator
   * Wrapper to return Playwright Locator for a given selector
   * ==========================================================================
   * @param {string} selector - CSS or text selector
   * @returns {Locator}
   */
  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }


  /**
   * ==========================================================================
   * goto
   * Navigate to a URL with default timeout and load state
   * ==========================================================================
   * @param {string} url - URL to navigate to
   */
  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'load', timeout: this.defaultTimeout });
  }


  /**
   * ==========================================================================
   * click
   * Click a locator or selector with visibility wait
   * ==========================================================================
   * @param {string | Locator} selectorOrLocator
   */
  async click(selectorOrLocator: string | Locator) {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    await el.waitFor({ state: 'visible', timeout: this.defaultTimeout });
    await el.click();
  }


  /**
   * ==========================================================================
   * fill
   * Fill an input field (Locator or selector) after waiting for visibility
   * ==========================================================================
   * @param {string | Locator} selectorOrLocator
   * @param {string} value - Value to enter
   */

  async fill(selectorOrLocator: string | Locator, value: string) {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    await el.waitFor({ state: 'visible', timeout: this.defaultTimeout });
    await el.fill(value);
  }


  /**
   * ==========================================================================
   * getText
   * Retrieve inner text from a locator or selector
   * ==========================================================================
   * @param {string | Locator} selectorOrLocator
   * @returns {Promise<string>}
   */
  async getText(selectorOrLocator: string | Locator): Promise<string> {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    await el.waitFor({ state: 'visible', timeout: this.defaultTimeout });
    return el.innerText();
  }


  /**
   * ==========================================================================
   * isVisible
   * Check visibility of element
   * ==========================================================================
   * @param {string | Locator} selectorOrLocator
   * @returns {Promise<boolean>}
   */
  async isVisible(selectorOrLocator: string | Locator): Promise<boolean> {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    return el.isVisible();
  }


  /**
   * Select a value from a Salesforce Lightning picklist
   * @param picklistLabel Label of the picklist (e.g., "Status")
   * @param value Value to select (e.g., "abc", "xyz")
   */
  async selectPicklistValue(picklistLabel: string, value: string) {
    // Find the combobox button next to the label
    const picklistButton = this.page.locator(`xpath=//button[@aria-label="${picklistLabel}"] | //input[@aria-label="${picklistLabel}"]`);
    await picklistButton.waitFor({ state: 'visible', timeout: this.defaultTimeout });
    await picklistButton.click();

    // Wait for the dropdown options to appear
    const dropdownOption = this.page.locator(`xpath=//span[@title='${value}']`).first();
    await dropdownOption.waitFor({ state: 'attached', timeout: this.defaultTimeout });

    // Click the desired option
    await dropdownOption.click({ force: true });

    // Optional: wait for dropdown to disappear (stability)
    await this.page.waitForTimeout(500);
  }


  /**
   * ==========================================================================
   * attempt
   * Retry-safe action wrapper
   * ==========================================================================
   * @param {() => Promise<void>} action - Async action to attempt
   * @param {number} retries             - Number of retries (default 2)
   */
  async attempt(action: () => Promise<void>, retries = 2) {
    let lastErr: any;
    for (let i = 0; i <= retries; i++) {
      try {
        await action();
        return;
      } catch (err) {
        lastErr = err;
        if (i < retries) await this.page.waitForTimeout(500);
      }
    }
    throw lastErr;
  }


  /**
   * ==========================================================================
   * screenshot
   * Capture full-page screenshot and save to ./reports
   * ==========================================================================
   * @param {string} name - File name for screenshot (default: 'screenshot')
   * @returns {Promise<Buffer>} Screenshot buffer
   */
  async screenshot(name = 'screenshot') {
    return this.page.screenshot({ path: `./reports/${name}.png`, fullPage: true });
  }
}
