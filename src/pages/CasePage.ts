/**
 * ============================================================================
 * CasePage
 * ----------------------------------------------------------------------------
 * Page Object Model for Salesforce Case page.
 * Handles navigation to Cases list, creating new cases, and exposing all
 * relevant UI element locators. Integrates with CaseCreation actions to
 * support data-driven case creation.
 *
 * Extends BasePage to inherit standard Playwright utility methods.
 * ============================================================================
 */
import { CaseCreation } from "@actions/case-actions/CaseCreation";
import { BasePage } from '@pages/BasePage';
import { Locator, Page } from '@playwright/test';


/**
 * ============================================================================
 * CasePage
 * ----------------------------------------------------------------------------
 * @author Kruti Unnithan
 *
 * @property {Locator} casesLink               - Sidebar link for "Cases"
 * @property {Locator} newCaseButton           - New Case button in list view
 * @property {Locator} subjectTextBox          - Subject input field
 * @property {Locator} descriptionTextBox      - Description input field
 * @property {Locator} internalCommentsTextBox - Internal Comments input field
 * @property {Locator} saveButton              - Save button for case creation
 * ============================================================================
 */
export class CasePage extends BasePage {
  readonly casesLink: Locator;
  readonly newCaseButton: Locator;
  readonly subjectTextBox: Locator;
  readonly descriptionTextBox: Locator;
  readonly internalCommentsTextBox: Locator;
  readonly saveButton: Locator;


  /**
 * ==========================================================================
 * Constructor
 * Initializes Salesforce Case Page locators.
 *
 * @param {Page} page - The Playwright page instance
 * ==========================================================================
 */
  constructor(page: Page) {
    super(page);
    this.casesLink = this.page.getByRole('link', { name: 'Cases' });
    this.newCaseButton = this.page.locator('//div[@title="New"]');
    this.subjectTextBox = this.page.getByRole('textbox', { name: 'Subject' });
    this.descriptionTextBox = this.page.getByRole('textbox', { name: 'Description' });
    this.internalCommentsTextBox = this.page.getByRole('textbox', { name: 'Internal Comments' });
    this.saveButton = this.page.getByRole('button', { name: 'Save', exact: true });
  }


  /**
  * ==========================================================================
  * createCase
  * Creates a Salesforce Case record using CaseCreation actions.
  * Accepts optional test data to override default synthetic data.
  *
  * @param {object} [data] - Optional case data (matches CaseCreation inputs)
  *
  * @example
  *   await casePage.createCase({ subject: "Test Case", description: "Details" });
  *
  * ==========================================================================
  */
  async createCase(data?: Parameters<typeof CaseCreation.caseCreation>[0]) {
    await CaseCreation.caseCreation(data);
  }
}
