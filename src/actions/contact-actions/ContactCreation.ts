import { PageProvider } from '@utils/ui-utils/PageProvider';
import { ContactPage } from '@pages/ContactPage';
import { TestDataFactory, DataSource } from '@utils/data-utils/TestDataFactory';

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
export class ContactActions {

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
    console.log(data);

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
