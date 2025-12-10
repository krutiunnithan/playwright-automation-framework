/**
 * ============================================================================
 * ContactPage
 * ----------------------------------------------------------------------------
 * Page Object Model for Salesforce Contact page.
 * Handles navigation, launching new contact creation, and exposing all
 * UI element locators required to create a Contact record.
 *
 * Integrates with ContactCreation actions for data-driven automation.
 * Extends BasePage to leverage shared Playwright utilities.
 * ============================================================================
 */
import { ContactCreation, ContactData } from "@actions/contact-actions/ContactCreation";
import { BasePage } from '@pages/BasePage';
import { Locator, Page } from '@playwright/test';


/**
 * ============================================================================
 * ContactPage
 * ----------------------------------------------------------------------------
 * @property {Locator} contactsLink             - Sidebar navigation link for Contacts
 * @property {Locator} newContactButton         - Button to open the New Contact modal/form
 * @property {Locator} firstNameTextBox         - First Name input field
 * @property {Locator} lastNameTextBox          - Last Name input field
 * @property {Locator} phoneTextBox             - Phone number input field
 * @property {Locator} emailTextBox             - Email input field
 * @property {Locator} mailingCountryComboBox   - Mailing Country picklist
 * @property {Locator} mailingCityTextBox       - Mailing City text input
 * @property {Locator} mailingStateComboBox     - Mailing State/Province picklist
 * @property {Locator} mailingZipTextBox        - Mailing Zip/Postal Code input
 * @property {Locator} saveButton               - Save button to submit the Contact form
 * ============================================================================
 */
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



  /**
   * ==========================================================================
   * Constructor
   * Initializes Salesforce Contact Page locators.
   *
   * @param {Page} page - Playwright page instance
   * ==========================================================================
   */
  constructor(page: Page) {
    super(page);
    this.contactsLink = this.page.getByRole('link', { name: 'Contacts' });
    this.newContactButton = this.page.locator('//div[@title="New"]');
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


  /**
  * ==========================================================================
  * createContact
  * Creates a Salesforce Contact record using ContactCreation actions.
  *
  * @param {object} [data] - Optional Contact data matching ContactCreation inputs
  *
  * @example
  *   await contactPage.createContact({ firstName: "John", lastName: "Doe" });
  * ==========================================================================
  */
  async createContact(data?: ContactData) {
    await ContactCreation.contactCreation(data);
  }
}
