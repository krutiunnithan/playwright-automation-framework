import { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { getGmailSecrets, getUserCreds } from '@utils/aws-utils/AwsSecrets';
import { fetchSalesforceOTPFromGmail } from '@helpers/gmail-otp-api';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly abc: Locator;
  readonly xyz: Locator;


  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = this.page.getByRole('textbox', { name: 'Password' });
    this.loginButton = this.page.getByRole('button', { name: 'Log In' });
    this.abc = this.page.getByRole('textbox', { name: 'Verification Code' });
    this.xyz = this.page.getByRole('button', { name: 'Verify' });
  }


  async login(profile: string) {
      const env = process.env.TEST_ENVIRONMENT_VALUE || 'dev';
      const creds = await getUserCreds(env, profile);
      console.log("creds returend : " + creds);
      await this.fill(this.usernameInput, creds.username);
      await this.fill(this.passwordInput, creds.password);
      await this.click(this.loginButton);

      // // 2. Wait for OTP input to appear
      // await this.page.waitForSelector('input[name="emc"]');
      // //getByRole('textbox', { name: 'Verification Code' })
      // await this.fill(this.page.getByRole('textbox', { name: 'Verification Code' }));

      // 3. Fetch Gmail secrets from AWS
      const secrets = await getGmailSecrets('playwright/gmail-otp-creds');
      console.log("2");
      console.log(secrets);

      // 4. Get OTP via Gmail API
      const otp = await fetchSalesforceOTPFromGmail(
        secrets.gmailClientId,
        secrets.gmailClientSecret,
        secrets.gmailRefreshToken
      );
      console.log(otp);

      // 5. Fill OTP and submit
      await this.fill(this.abc, otp);
      await this.click(this.xyz);
      //getByRole('button', { name: 'Verify' })

      // 6. Wait for Salesforce landing page
      //await this.page.waitForLoadState('networkidle');

  }
}
