import { expect } from '@playwright/test';
import { PageProvider } from '@utils/ui-utils/PageProvider';

export class LoginValidations {
  static async validateDashboard() {
    const page = PageProvider.page;

    await expect(page).toHaveTitle("App Launcher");

  }
}

