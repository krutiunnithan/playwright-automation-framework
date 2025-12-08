/**
 * ============================================================================
 * GenericValidations
 * ----------------------------------------------------------------------------
 * Centralized validation methods for the common salesforce behavior.
 * 
 * Purpose:
 * - Separates UI validation logic from Page Object Model (POM) logic.
 * - Provides reusable assertions for test cases.
 * ============================================================================
 */
import { expect } from '@playwright/test';
import { PageProvider } from '@utils/ui-utils/PageProvider';

export class GenericValidations {

  /**
   * ==========================================================================
   * validateToastMessage
   * ----------------------------------------------------------------------------
   * Validates that the toast message appears.
   * @param expectedMessage - The message text you expect to see
   * @throws {Error} If the toast message does not match expected message
   * ==========================================================================
   */
  static async validateToastMessage(expectedMessage: RegExp | string) {
    const page = await PageProvider.getPage();

    // Playwright locator for the toast
    const toast = page.locator("//div[@class='forceVisualMessageQueue']/following-sibling::div[@role='status']");

    // Wait for it to appear
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    // Assert text content matches expected
    await expect(toast).toHaveText(expectedMessage);
  }
}

