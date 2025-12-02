/**
 * ============================================================================
 * LoginPage
 * ----------------------------------------------------------------------------
 * Page Object Model for Salesforce Login page.
 * Handles login, logout, OTP verification, and error validations.
 * Extends BasePage to leverage common Playwright actions and utilities.
 * ============================================================================
 */
import { fetchSalesforceOTPFromGmail } from '@helpers/gmail-otp-api';
import { BasePage } from '@pages/BasePage';
import { Locator, Page } from '@playwright/test';
import { getGmailSecrets, getUserCreds } from '@utils/aws-utils/AwsSecrets';


/**
 * ============================================================================
 * LoginPage
 * ----------------------------------------------------------------------------
 * @author Kruti Unnithan
 *
 * @property {Locator} usernameInput  - Username input field
 * @property {Locator} passwordInput  - Password input field
 * @property {Locator} loginButton    - Log In button
 * @property {Locator} otpTextBox     - Salesforce OTP input
 * @property {Locator} verifyButton   - Verify OTP button
 * @property {Locator} profileButton  - User profile button
 * @property {Locator} logoutLink     - Logout link
 * @property {Locator} loginErrorText - Login error message text
 * ============================================================================
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly otpTextBox: Locator;
  readonly verifyButton: Locator;
  readonly profileButton: Locator;
  readonly logoutLink: Locator;
  readonly loginErrorText: Locator;


  /**
   * ==========================================================================
   * Constructor
   * @param {Page} page - Playwright page instance
   * ==========================================================================
   */
  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = this.page.getByRole('textbox', { name: 'Password' });
    this.loginButton = this.page.getByRole('button', { name: 'Log In' });
    this.otpTextBox = this.page.getByRole('textbox', { name: 'Verification Code' });
    this.verifyButton = this.page.getByRole('button', { name: 'Verify' });
    this.profileButton = this.page.getByRole('button', { name: 'View profile' });
    this.logoutLink = this.page.getByRole('link', { name: 'Log Out' });
    this.loginErrorText = this.page.getByText('Error: Please check your');
  }

  /**
   * ==========================================================================
   * login
   * Performs login using a specified user profile.
   * Handles optional OTP verification if required.
   *
   * @param {string} profile - User profile key (e.g., 'case manager', 'system admin')
   * ==========================================================================
   */
  async login(profile: string) {
    const env = process.env.TEST_ENVIRONMENT_VALUE || 'dev';
    const creds = await getUserCreds(env, profile);

    // Step 1: Fill username & password
    await this.fill(this.usernameInput, creds.username);
    await this.fill(this.passwordInput, creds.password);
    await this.click(this.loginButton);


    // Step 2: Handle OTP if input is visible
    const otpBool = await this.otpTextBox.isVisible();

    if (otpBool) {
      const secrets = await getGmailSecrets('playwright/gmail-otp-creds');

      // Step 3: Fetch OTP via Gmail API
      const otp = await fetchSalesforceOTPFromGmail(
        secrets.gmailClientId,
        secrets.gmailClientSecret,
        secrets.gmailRefreshToken
      );

      // Step 4: Fill OTP and submit
      await this.fill(this.otpTextBox, otp);
      await this.click(this.verifyButton);
    }

  }

  /**
   * ==========================================================================
   * logout
   * Logs out the currently logged-in user
   * ==========================================================================
   */
  async logout() {
    await this.click(this.profileButton);
    await this.click(this.logoutLink);
  }

  /**
   * ==========================================================================
   * getLoginError
   * Retrieves login error message text
   *
   * @returns {Promise<string>} Error message string
   * ==========================================================================
   */
  async getLoginError(): Promise<string> {
    return this.loginErrorText.innerText();
  }
}
