import { expect, Locator } from '@playwright/test';
import { PageProvider } from '@utils/ui-utils/PageProvider';
import {LoginPage} from "@pages/LoginPage";
import { ContactPage } from '@pages/ContactPage';

export class ContactActions {

  static async contactCreation({
    salutation = "Mr.",
    firstName = "richie",
    lastName = "rich",
    phone = "36987656001",
    email = "richierich@test.com",
    country = "Australia",
    city = "Perth",
    state = "Western Australia",
    zip = "6100"
  }: {
    salutation?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    country?: string;
    city?: string;
    state?: string;
    zip?: string;
  } = {}) {
    
    const page = PageProvider.page;
    const contactPage = new ContactPage(page);

    
    await contactPage.click(contactPage.contactsLink);
    await contactPage.click(contactPage.newContactButton);

    await contactPage.selectPicklistValue("Salutation", salutation);

    await contactPage.fill(contactPage.firstNameTextBox, firstName);
    await contactPage.fill(contactPage.lastNameTextBox, lastName);

    await contactPage.fill(contactPage.phoneTextBox, phone);
    await contactPage.fill(contactPage.emailTextBox, email);

    await contactPage.selectPicklistValue("Mailing Country", country);

    await contactPage.fill(contactPage.mailingCityTextBox, city);

    await contactPage.selectPicklistValue("Mailing State/Province", state);

    await contactPage.fill(contactPage.mailingZipTextBox, zip);

    await contactPage.click(contactPage.saveButton);

  }

}

