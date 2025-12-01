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
import { expect, Locator } from '@playwright/test';
import { PageProvider } from '@utils/ui-utils/PageProvider';
import { ContactPage } from "@pages/ContactPage";

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
    const page = PageProvider.page;
    
    // Playwright locator for the toast
    const toast = page.locator("//div[@class='forceVisualMessageQueue']/following-sibling::div[@role='status']");

    // Wait for it to appear
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    const msg = await toast.textContent();

    // Assert text content matches expected
    console.log(msg);
    // Success notification.Contact "Mr. firstname3 lastname3" was created. Press Control + F6 to navigate to the next toast notification or focusable region.
    await expect(toast).toHaveText(expectedMessage);
  }
}

