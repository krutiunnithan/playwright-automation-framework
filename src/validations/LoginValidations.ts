import { LoginPage } from '@pages/LoginPage';
import { expect, Page } from '@playwright/test';
import { PageProvider } from '@utils/ui-utils/PageProvider';

export class LoginValidations {
  /**
   * ==========================================================================
   * validateDashboard
   * ----------------------------------------------------------------------------
   * Validates that the dashboard has loaded by checking the page title.
   * 
   * @param page - Optional Page instance. If not provided, uses PageProvider
   * @throws {Error} If the page title does not match expected pattern
   * ==========================================================================
   */

  static async validateDashboard(page?: Page): Promise<void> {
    const pageToUse = page || await PageProvider.getPage();
    expect(pageToUse).toHaveTitle(/Salesforce|Lightning Experience/i, { timeout: 30000 });
  }

  /**
   * ==========================================================================
   * validateLoginFailure
   * ----------------------------------------------------------------------------
   * Validates that login failed and appropriate error message is displayed.
   * This method fetches the error message via the LoginPage POM.
   * 
   * @param page - Optional Page instance. If not provided, uses PageProvider
   * @throws {Error} If the expected error message is not found
   * ==========================================================================
   */
  static async validateLoginFailure(page?: Page) {

    // Give page a moment to stabilize before validation
    await new Promise(resolve => setTimeout(resolve, 500));

    const pageToUse = page || await PageProvider.getPage();

    // Initialize the LoginPage POM to access error text
    const loginPage = new LoginPage(pageToUse);

    // Retrieve actual error message from UI with retry
    let errorText = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        errorText = await loginPage.getLoginError();
        if (errorText && errorText.length > 0) {
          break; // Got the error text, stop retrying
        }
      } catch (err) {
        console.log(`[validateLoginFailure] Attempt ${attempts + 1} failed, retrying...`);
      }
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Assert that the error text matches expected message
    expect(errorText).toContain("Error: Please check your username and password. If you still can't log in, contact your Salesforce administrator.");
  }
}