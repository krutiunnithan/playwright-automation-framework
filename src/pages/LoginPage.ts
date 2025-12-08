import { fetchSalesforceOTPFromGmail } from '@helpers/gmail-otp-api';
import { BasePage } from '@pages/BasePage';
import { Locator, Page } from '@playwright/test';
import { getGmailSecrets, getUserCreds } from '@utils/aws-utils/AwsSecrets';
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

  private readonly postLoginCheckTimeout = 30_000;
  private readonly otpFetchTimeout = 180_000;
  private workerIndex: number;
  private moduleType: 'contact' | 'case' | 'login' = 'login';
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

  setModuleType(module: 'contact' | 'case' | 'login'): void {
    this.moduleType = module;
    console.log(`[LoginPage] Module type set to: ${module}`);
  }

  private getModuleUrl(): string {
    switch (this.moduleType) {
      case 'contact':
        return '/lightning/o/Contact/list?filterName=__Recent';
      case 'case':
        return '/lightning/o/Case/list?filterName=__Recent';
      default:
        return '/lightning/page/home';
    }
  }

  private async applyStaggerDelay(): Promise<void> {
    const normalizedWorkerIndex = this.workerIndex % 3;
    const delayPerWorkerMs = 45_000;
    const totalDelayMs = normalizedWorkerIndex * delayPerWorkerMs;

    if (totalDelayMs > 0) {
      const delaySeconds = Math.round(totalDelayMs / 1000);
      console.log(
        `[LoginPage] Applying stagger delay: ${delaySeconds}s for worker ${this.workerIndex} (normalized: ${normalizedWorkerIndex})`
      );
      await new Promise((resolve) => setTimeout(resolve, totalDelayMs));
    }
  }

  private async isSessionValid(): Promise<boolean> {
    try {
      await this.profileButton.waitFor({ state: 'visible', timeout: 5_000 });
      return true;
    } catch (_) {
      return false;
    }
  }

  private async tryReuseStorage(profile: string): Promise<boolean> {
    const exists = SessionUtils.storageStateExists(profile, this.workerIndex);
    if (!exists) return false;

    try {
      const applied = await SessionUtils.applyStorageState(
        this.page,
        profile,
        this.workerIndex
      );
      if (!applied) {
        // applyStorageState() returns false for:
        // 1. Profile mismatch (session belongs to different profile) - DO NOT delete
        // 2. File load failure - DO NOT delete (file might be used by another worker)
        // Just return false and proceed with fresh login
        console.log(`[LoginPage] Session file exists but cannot be reused, proceeding with fresh login`);
        return false;
      }

      await this.page.goto('/', { waitUntil: 'domcontentloaded' });

      const moduleUrl = this.getModuleUrl();
      console.log(`[LoginPage] Reusing session, navigating to: ${moduleUrl}`);
      await this.page.goto(moduleUrl, { waitUntil: 'domcontentloaded' });

      let currentUrl = this.page.url();
      if (currentUrl.includes('developer-edition') || currentUrl.includes('/setup')) {
        console.log(`[LoginPage] Session redirected to setup page, session may be stale`);
        SessionUtils.deleteStorageState(profile, this.workerIndex);
        return false;
      }

      const isValid = await this.isSessionValid();
      if (!isValid) {
        console.log(
          `⚠️  [LoginPage] Session exists but is stale (user logged out), clearing...`
        );
        SessionUtils.deleteStorageState(profile, this.workerIndex);
        return false;
      }

      try {
        await this.page.locator('.slds-scope').waitFor({ state: 'visible', timeout: 5_000 });
      } catch (_) {
        console.log(`[LoginPage] Lightning UI load delayed, continuing...`);
      }

      console.log(
        `✓ [LoginPage] Reused VALID session for worker ${this.workerIndex}`
      );
      return true;
    } catch (err) {
      console.log(`[LoginPage] Error during session reuse: ${err}`);
      // On exception, don't delete - just return false and proceed with fresh login
      return false;
    }
  }

  async login(profile: string) {
    const env = process.env.TEST_ENVIRONMENT_VALUE || 'dev';

    // 1) FETCH CREDENTIALS FIRST
    this.cachedCreds = await getUserCreds(env, profile, this.workerIndex);
    console.log(
      `[LoginPage] Logging in ${profile} (worker ${this.workerIndex}) as ${this.cachedCreds.username}`
    );

    // 2) CHECK IF SESSION REUSE IS ALLOWED
    const shouldReuseSession = this.cachedCreds.allowSessionReuse !== false;

    if (shouldReuseSession) {
      const reused = await this.tryReuseStorage(profile);
      if (reused) return;
    } else {
      console.log(`[LoginPage] User "${this.cachedCreds.username}" has allowSessionReuse=false, clearing any existing session`);
      // CRITICAL: Clear the page context to remove any old cookies/storage
      // This is done BEFORE any navigation to ensure a truly fresh state
      await this.page.context().clearCookies();
      
      // Also delete the session file to prevent accidental reuse
      SessionUtils.deleteStorageState(profile, this.workerIndex);
      
      console.log(`[LoginPage] Page context cleared for fresh login attempt`);
    }

    // 3) APPLY STAGGER DELAY
    await this.applyStaggerDelay();

    // 4) EXPLICIT WAIT for login form - with retry
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

    // 5) Submit login credentials
    await this.fill(this.usernameInput, this.cachedCreds.username);
    await this.fill(this.passwordInput, this.cachedCreds.password);

    const loginSubmitTime = Date.now();
    console.log(
      `[LoginPage] Submitted credentials at ${new Date(loginSubmitTime).toISOString()}`
    );

    await this.click(this.loginButton);
    await this.page.waitForTimeout(1500);

    // 6) Check for login error BEFORE OTP
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

    // 7) Handle OTP if visible
    let otpVisible = false;
    try {
      otpVisible = await this.otpTextBox.isVisible({ timeout: 10_000 });
    } catch (_) {
      otpVisible = false;
    }

    if (otpVisible) {
      console.log('[LoginPage] OTP prompt detected, fetching from Gmail...');
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
        await this.fill(this.otpTextBox, otp);
        await this.click(this.verifyButton);
      } catch (err) {
        throw new Error(`[LoginPage] Failed to fetch OTP: ${String(err)}`);
      }
    }

    // 8) Navigate to Lightning module
    const moduleUrl = this.getModuleUrl();
    console.log(`[LoginPage] Navigating to module: ${moduleUrl}`);
    await this.page.goto(moduleUrl);

    // 10) Save session - but NOT for allowSessionReuse=false users
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
  }

  async logout() {
    await this.click(this.profileButton);
    await this.click(this.logoutLink);

    await this.page.waitForURL(/login/, { timeout: 10_000 }).catch(() => { });

    const allProfiles = ['casemanager', 'systemadmin', 'accommodationsmanager'];
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

  async getLoginError(): Promise<string> {
    return this.loginErrorText.innerText();
  }
}