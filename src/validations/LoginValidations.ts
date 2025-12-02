/**
 * ============================================================================
 * LoginValidations
 * ----------------------------------------------------------------------------
 * Centralized validation methods for the Login module.
 * 
 * Purpose:
 * - Separates UI validation logic from Page Object Model (POM) logic.
 * - Provides reusable assertions for test cases.
 * ============================================================================
 */
import { LoginPage } from "@pages/LoginPage";
import { expect } from '@playwright/test';
import { PageProvider } from '@utils/ui-utils/PageProvider';

export class LoginValidations {

  /**
   * ==========================================================================
   * validateDashboard
   * ----------------------------------------------------------------------------
   * Validates that the Salesforce dashboard is successfully displayed.
   * 
   * @throws {Error} If the page title does not match expected pattern
   * ==========================================================================
   */
  static async validateDashboard() {
    const page = PageProvider.page;
    await expect(page).toHaveTitle(/Salesforce/i, { timeout: 30000 });
  }

  /**
   * ==========================================================================
   * validateLoginFailure
   * ----------------------------------------------------------------------------
   * Validates that login failed and appropriate error message is displayed.
   * This method fetches the error message via the LoginPage POM.
   * 
   * @throws {Error} If the expected error message is not found
   * ==========================================================================
   */
  static async validateLoginFailure() {
    const page = PageProvider.page;

    // Initialize the LoginPage POM to access error text
    const loginPage = new LoginPage(page);

    // Retrieve actual error message from UI
    const errorText = await loginPage.getLoginError();

    // Assert that the error text matches expected message
    expect(errorText).toContain("Error: Please check your username and password. If you still can't log in, contact your Salesforce administrator.");
  }
}

