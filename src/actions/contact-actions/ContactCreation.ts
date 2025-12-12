import { AppRoutes } from '@data/constants/app-routes';
import { ContactFormFields } from '@data/constants/form-fields';
import { DataSource } from '@data/enums/data-sources.enums';
import { SalesforceModule } from '@data/enums/modules.enums';
import { ContactPage } from '@pages/ContactPage';
import { TestDataFactory } from '@utils/data-utils/TestDataFactory';
import { PageProvider } from '@utils/ui-utils/PageProvider';


/**
 * ============================================================================
 * ContactData Interface
 * ----------------------------------------------------------------------------
 * Defines the structure of the data required to create a Contact record
 * in Salesforce.
 *
 * All properties are optional because:
 *   - Tests may override only specific values
 *   - Missing fields can be auto-populated by TestDataFactory
 *
 * This allows flexibility while ensuring the Contact creation flow
 * remains fully data-driven.
 * ============================================================================
 */
export interface ContactData {
  salutation?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Contact actions to create a contact in Salesforce.
 * Optional data can be passed, otherwise TestDataFactory is used.
 */
export class ContactCreation {

  /**
  * ==========================================================================
  * contactCreation
  * --------------------------------------------------------------------------
  * Creates a Contact record via Salesforce UI.
  *
  * @param data        Optional ContactData object to override test values
  *
  * Behavior:
  *   - Defaults dataSource to 'synthetic' 
  *   - If `data` is not provided, retrieves Contact data from TestDataFactory
  *   - Executes all UI interactions using ContactPage POM methods
  *
  * Throws:
  *   - Error if TestDataFactory fails to return contact data
  * ==========================================================================
  */
  static async contactCreation(data?: ContactData) {
    try {
      // Use synthetic by default
      if (!data) {
        data = await TestDataFactory.getData(SalesforceModule.CONTACT, DataSource.SYNTHETIC);
        if (!data) {
          throw new Error('Failed to fetch contact data from TestDataFactory');
        }
      }

      const page = await PageProvider.getPage();
      const contactPage = new ContactPage(page);

      // Navigate to contact list view
      await page.goto(AppRoutes.CONTACT_LIST, { waitUntil: 'domcontentloaded' });

      // Contact creation steps
      await contactPage.click(contactPage.newContactButton);

      await contactPage.selectPicklistValue(ContactFormFields.SALUTATION, data.salutation!);
      await contactPage.fill(contactPage.firstNameTextBox, data.firstName!);
      await contactPage.fill(contactPage.lastNameTextBox, data.lastName!);
      await contactPage.fill(contactPage.phoneTextBox, data.phone!);
      await contactPage.fill(contactPage.emailTextBox, data.email!);
      await contactPage.selectPicklistValue(ContactFormFields.MAILING_COUNTRY, data.country!);
      await contactPage.fill(contactPage.mailingCityTextBox, data.city!);
      await contactPage.selectPicklistValue(ContactFormFields.MAILING_STATE, data.state!);
      await contactPage.fill(contactPage.mailingZipTextBox, data.zip!);
      await contactPage.click(contactPage.saveButton);
    }
    catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
