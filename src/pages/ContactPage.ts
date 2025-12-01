import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { getGmailSecrets, getUserCreds } from '@utils/aws-utils/AwsSecrets';
import { fetchSalesforceOTPFromGmail } from '@helpers/gmail-otp-api';
import { ContactActions } from "actions/contact-actions/ContactCreation"

export class ContactPage extends BasePage {
  readonly contactsLink: Locator;
  readonly newContactButton: Locator;
  readonly firstNameTextBox: Locator;
  readonly lastNameTextBox: Locator;
  readonly phoneTextBox: Locator;
  readonly emailTextBox: Locator;
  readonly mailingCountryComboBox: Locator;
  readonly mailingCityTextBox: Locator;
  readonly mailingStateComboBox: Locator;
  readonly mailingZipTextBox: Locator;
  readonly saveButton: Locator;



  constructor(page: Page) {
    super(page);
    this.contactsLink = this.page.getByRole('link', { name: 'Contacts' });
    this.newContactButton = this.page.locator('//button[@name="NewContact"]');
    this.firstNameTextBox = this.page.getByRole('textbox', { name: 'First Name' });
    this.lastNameTextBox = this.page.getByRole('textbox', { name: 'Last Name' });
    this.phoneTextBox = this.page.getByRole('textbox', { name: 'Phone', exact: true });
    this.emailTextBox = this.page.getByRole('textbox', { name: 'Email' });
    this.mailingCountryComboBox = this.page.getByRole('combobox', { name: 'Mailing Country' });
    this.mailingCityTextBox = this.page.getByRole('textbox', { name: 'Mailing City' });
    this.mailingStateComboBox = this.page.getByRole('combobox', { name: 'Mailing State/Province' });
    this.mailingZipTextBox = this.page.getByRole('textbox', { name: 'Mailing Zip/Postal Code' });
    this.saveButton = this.page.getByRole('button', { name: 'Save', exact: true });
  }


  async createContact(data?: Parameters<typeof ContactActions.contactCreation>[0]) {
    await ContactActions.contactCreation(data);
  }
}
