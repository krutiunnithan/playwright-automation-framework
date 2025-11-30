import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { getGmailSecrets, getUserCreds } from '@utils/aws-utils/AwsSecrets';
import { fetchSalesforceOTPFromGmail } from '@helpers/gmail-otp-api';
import { ContactActions } from "actions/contact-actions/ContactCreation"

export class ContactPage extends BasePage {
  readonly usernameInput: Locator;



  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.getByRole('textbox', { name: 'Username' });

  }


  async createContact() {
    ContactActions.contactCreation();
  }

     


}
