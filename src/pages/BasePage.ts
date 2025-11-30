// src/pages/basePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  protected readonly defaultTimeout = 60_000;

  constructor(page: Page) {
    this.page = page;
  }

  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'load', timeout: this.defaultTimeout });
  }

  async click(selectorOrLocator: string | Locator) {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    await el.waitFor({ state: 'visible', timeout: this.defaultTimeout });
    await el.click();
  }

//   async fill(selector: string, value: string) {
//     const el = this.locator(selector);
//     await el.waitFor({ state: 'visible', timeout: this.defaultTimeout });
//     await el.fill(value);
//   }

  async fill(selectorOrLocator: string | Locator, value: string) {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    await el.waitFor({ state: 'visible', timeout: this.defaultTimeout });
    await el.fill(value);
}


  async getText(selectorOrLocator: string | Locator): Promise<string> {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    await el.waitFor({ state: 'visible', timeout: this.defaultTimeout });
    return el.innerText();
  }

  async isVisible(selectorOrLocator: string | Locator): Promise<boolean> {
    const el = typeof selectorOrLocator === 'string' ? this.locator(selectorOrLocator) : selectorOrLocator;
    return el.isVisible();
  }

  // handy retry-safe action wrapper
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

  async waitForTimeout() {
    await this.page.waitForTimeout(90000);
  }

  // attach screenshot helper to test.info() in tests (to be used from tests)
  async screenshot(name = 'screenshot') {
    return this.page.screenshot({ path: `./reports/${name}.png`, fullPage: true });
  }
}
