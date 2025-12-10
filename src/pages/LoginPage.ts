import { getAllUserProfiles } from '@data/enums/user-profiles.enums';
import { fetchSalesforceOTPFromGmail } from '@helpers/gmail-otp-api';
import { BasePage } from '@pages/BasePage';
import { Locator, Page } from '@playwright/test';
import { getGmailSecrets, getUserCreds } from '@utils/aws-utils/AwsSecrets';
import { acquireUserLock } from '@utils/aws-utils/UserLock';
import { parallelLogger } from '@utils/log-utils/ParallelExecutionLogger';
import { LoginUtil } from '@utils/login-utils/LoginUtil';
import * as SessionUtils from '@utils/session-utils';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly otpTextBox: Locator;
  readonly verifyButton: Locator;
  readonly profileButton: Locator;
  readonly logoutLink: Locator;
  readonly loginErrorText: Locator;

  private readonly otpFetchTimeout: number = parseInt(process.env.OTP_FETCH_TIMEOUT_MS || '180000', 10);
  private workerIndex: number;
  private cachedCreds: any = null;

  constructor(page: Page, workerIndex?: number) {
    super(page);
    this.workerIndex = workerIndex ?? 0;
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
   * Logs in user with credentials, OTP, and session management
   * @param profile User profile (e.g., 'casemanager', 'systemadmin')
   */
  async login(profile: string) {
    const env = process.env.TEST_ENVIRONMENT_VALUE || 'dev';

    // 1) FETCH CREDENTIALS FIRST
    this.cachedCreds = await getUserCreds(env, profile, this.workerIndex);
    console.log(
      `[LoginPage] Logging in ${profile} (worker ${this.workerIndex}) as ${this.cachedCreds.username}`
    );

    // 2) ACQUIRE USER LOCK (prevents concurrent use of same user by different workers)
    // Lock will be released in afterEach hook, not here
    await acquireUserLock(
      this.cachedCreds.username,
      this.workerIndex,
      profile,
      `test`
    );

    // 3) CHECK IF SESSION REUSE IS ALLOWED
    const shouldReuseSession = this.cachedCreds.allowSessionReuse !== false;

    if (shouldReuseSession) {
      const reused = await LoginUtil.tryReuseStorage(
        this.page,
        this.profileButton,
        profile,
        this.workerIndex
      );
      if (reused) {
        parallelLogger.logSessionReuse(this.workerIndex, this.cachedCreds.username, profile);
        return;
      }
    } else {
      console.log(`[LoginPage] User "${this.cachedCreds.username}" has allowSessionReuse=false, clearing any existing session`);
      parallelLogger.logFreshLogin(this.workerIndex, this.cachedCreds.username, profile);
      await this.page.context().clearCookies();
      SessionUtils.deleteStorageState(profile, this.workerIndex);
      console.log(`[LoginPage] Page context cleared for fresh login attempt`);
    }

    // 4) APPLY STAGGER DELAY
    await LoginUtil.applyStaggerDelay(this.workerIndex);

    // 5) EXPLICIT WAIT for login form - with retry
    console.log('[LoginPage] Waiting for login form to load...');
    let formReady = false;
    let retries = 0;
    const maxRetries = 2;

    while (!formReady && retries <= maxRetries) {
      try {
        await this.usernameInput.waitFor({ state: 'visible', timeout: 30_000 });
        await this.passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
        formReady = true;
        console.log('[LoginPage] ✓ Login form is ready');
      } catch (err) {
        retries++;
        if (retries <= maxRetries) {
          console.log(`[LoginPage] Login form not ready (attempt ${retries}/${maxRetries}), clearing cookies and reloading...`);
          try {
            await this.page.context().clearCookies();
            const salesforceUrl = process.env.SALESFORCE_ORG_URL || 'https://orgfarm-4a2ccda1cd-dev-ed.develop.lightning.force.com';
            await this.page.goto(salesforceUrl, { waitUntil: 'domcontentloaded' });
            await this.page.waitForTimeout(1000);
          } catch (_) {
            // ignore
          }
        } else {
          throw new Error(`[LoginPage] Login form failed to load after ${maxRetries} retries`);
        }
      }
    }

    // 6) Submit login credentials
    await this.fill(this.usernameInput, this.cachedCreds.username);
    await this.fill(this.passwordInput, this.cachedCreds.password);

    const loginSubmitTime = Date.now();
    console.log(
      `[LoginPage] Submitted credentials at ${new Date(loginSubmitTime).toISOString()}`
    );

    await this.click(this.loginButton);
    await this.page.waitForTimeout(1500);

    // 7) Check for login error BEFORE OTP
    let errorMessageVisible = false;
    try {
      errorMessageVisible = await this.loginErrorText.isVisible({ timeout: 5_000 });
    } catch (_) {
      errorMessageVisible = false;
    }

    if (errorMessageVisible) {
      console.log('[LoginPage] ❌ Login failed - error message detected. Stopping here.');
      return;
    }

    // 8) Handle OTP if visible
    let otpVisible = false;
    try {
      otpVisible = await this.otpTextBox.isVisible({ timeout: 10_000 });
    } catch (_) {
      otpVisible = false;
    }

    if (otpVisible) {
      console.log('[LoginPage] OTP prompt detected, fetching from Gmail...');
      const otpStartTime = Date.now();
      const secrets = await getGmailSecrets('playwright/gmail-otp-creds');
      const testRunId = `run_${Date.now()}_${Math.floor(Math.random() * 10000)}_worker${this.workerIndex}`;

      try {
        const otp = await fetchSalesforceOTPFromGmail(
          testRunId,
          secrets.gmailClientId,
          secrets.gmailClientSecret,
          secrets.gmailRefreshToken,
          'from:noreply@salesforce.com subject:"Verify your identity"',
          this.otpFetchTimeout,
          loginSubmitTime,
          this.cachedCreds.username
        );

        console.log(`[LoginPage] OTP received: ${otp}`);
        const otpWaitTime = Date.now() - otpStartTime;
        parallelLogger.logOtpClaim(this.workerIndex, this.cachedCreds.username, otp, otpWaitTime);
        await this.fill(this.otpTextBox, otp);
        await this.click(this.verifyButton);
      } catch (err) {
        throw new Error(`[LoginPage] Failed to fetch OTP: ${String(err)}`);
      }
    }

    // 9) Save session - but NOT for allowSessionReuse=false users
    if (this.cachedCreds.allowSessionReuse !== false) {
      await SessionUtils.saveStorageState(
        this.page,
        profile,
        this.workerIndex,
        this.cachedCreds.username
      );
      console.log(`✓ [LoginPage] Saved session for worker ${this.workerIndex}`);
    } else {
      console.log(`[LoginPage] Skipping session save for user "${this.cachedCreds.username}" (allowSessionReuse=false)`);
    }

    // 10) Wait for dashboard to load (profile button visible indicates successful login)
    try {
      await this.profileButton.waitFor({ state: 'visible', timeout: 15_000 });
      console.log(`✓ [LoginPage] Dashboard loaded, profile button visible`);
    } catch (err) {
      console.warn(`[LoginPage] Dashboard load delayed, but continuing...`);
    }
  }

  /**
   * Logs out the current user and clears all sessions
   */
  async logout() {
    // Wait for page to be ready (profile button visible) before attempting logout
    try {
      await this.profileButton.waitFor({ state: 'visible', timeout: 10_000 });
      console.log('[LoginPage] Profile button visible, proceeding with logout');
    } catch (err) {
      console.log('[LoginPage] Profile button not visible, attempting navigation to home...');
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
      await this.profileButton.waitFor({ state: 'visible', timeout: 10_000 });
    }

    await this.click(this.profileButton);
    await this.click(this.logoutLink);

    await this.page.waitForURL(/login/, { timeout: 10_000 }).catch(() => { });

    const allProfiles = getAllUserProfiles();
    for (const prof of allProfiles) {
      try {
        SessionUtils.deleteStorageState(prof, this.workerIndex);
      } catch (_) {
        // ignore
      }
    }

    this.cachedCreds = null;

    console.log(
      `✓ [LoginPage] Logged out and cleared session for worker ${this.workerIndex}`
    );
  }

  /**
   * Gets login error message if login failed
   * @returns Error message text
   */
  async getLoginError(): Promise<string> {
    return this.loginErrorText.innerText();
  }
}