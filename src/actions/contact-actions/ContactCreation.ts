import { expect, Locator } from '@playwright/test';
import { PageProvider } from '@utils/ui-utils/PageProvider';
import {LoginPage} from "@pages/LoginPage";
import { ContactPage } from '@pages/ContactPage';

export class ContactActions {

  static async contactCreation() {
    
    const page = PageProvider.page;
    const cnt = new ContactPage(page);
    await expect(page).toHaveTitle(/Salesforce/i, { timeout: 30000 });
  }

}

