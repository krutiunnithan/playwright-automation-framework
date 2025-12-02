import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { CaseActions } from "@actions/case-actions/CaseCreation"

export class CasePage extends BasePage {
  readonly casesLink: Locator;
  readonly newCaseButton: Locator;
  readonly subjectTextBox: Locator;
  readonly descriptionTextBox: Locator;
  readonly internalCommentsTextBox: Locator;
  readonly saveButton: Locator;


  constructor(page: Page) {
    super(page);
    this.casesLink = this.page.getByRole('link', { name: 'Cases' });
    this.newCaseButton = this.page.locator('//div[@title="New"]');
    this.subjectTextBox = this.page.getByRole('textbox', { name: 'Subject' });
    this.descriptionTextBox = this.page.getByRole('textbox', { name: 'Description' });
    this.internalCommentsTextBox = this.page.getByRole('textbox', { name: 'Internal Comments' });
    this.saveButton = this.page.getByRole('button', { name: 'Save', exact: true });
  }


  async createCase(data?: Parameters<typeof CaseActions.caseCreation>[0]) {
    await CaseActions.caseCreation(data);
  }
}
