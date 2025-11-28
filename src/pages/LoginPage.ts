import { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { getUserCreds } from '@utils/aws-utils/AwsSecrets';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;


  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = this.page.getByRole('textbox', { name: 'Password' });
    this.loginButton = this.page.getByRole('button', { name: 'Log In' });
  }


  async login(profile: string) {
      const env = process.env.TEST_ENVIRONMENT_VALUE || 'dev';
      const creds = await getUserCreds(env, profile);
      console.log("creds returend : " + creds);
      await this.fill(this.usernameInput, creds.username);
      await this.fill(this.passwordInput, creds.password);
      await this.click(this.loginButton);
  }
}
