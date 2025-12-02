import { ContactPage } from '@pages/ContactPage';
import { DataSource, TestDataFactory } from '@utils/data-utils/TestDataFactory';
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
  * @param dataSource  Optional DataSource ('synthetic', 'soql', etc.)
  *
  * Behavior:
  *   - Defaults dataSource to 'synthetic' unless overridden
  *   - If `data` is not provided, retrieves Contact data from TestDataFactory
  *   - Executes all UI interactions using ContactPage POM methods
  *
  * Throws:
  *   - Error if TestDataFactory fails to return contact data
  * ==========================================================================
  */
  static async contactCreation(
    data?: ContactData,
    dataSource?: DataSource  // <-- allow test to override
  ) {
    // If no explicit dataSource, default to 'synthetic'
    const source: DataSource = dataSource ?? 'synthetic';

    // Fetch synthetic or SOQL data if no args provided
    if (!data) {
      data = await TestDataFactory.getData('contact', source);
      if (!data) {
        throw new Error('Failed to fetch contact data from TestDataFactory');
      }
    }

    const page = PageProvider.page;
    const contactPage = new ContactPage(page);

    await contactPage.click(contactPage.contactsLink);
    await contactPage.click(contactPage.newContactButton);

    await contactPage.selectPicklistValue("Salutation", data.salutation!);
    await contactPage.fill(contactPage.firstNameTextBox, data.firstName!);
    await contactPage.fill(contactPage.lastNameTextBox, data.lastName!);
    await contactPage.fill(contactPage.phoneTextBox, data.phone!);
    await contactPage.fill(contactPage.emailTextBox, data.email!);
    await contactPage.selectPicklistValue("Mailing Country", data.country!);
    await contactPage.fill(contactPage.mailingCityTextBox, data.city!);
    await contactPage.selectPicklistValue("Mailing State/Province", data.state!);
    await contactPage.fill(contactPage.mailingZipTextBox, data.zip!);

    await contactPage.click(contactPage.saveButton);
  }
}
