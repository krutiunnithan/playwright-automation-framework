import { CasePage } from '@pages/CasePage';
import { DataSource, TestDataFactory } from '@utils/data-utils/TestDataFactory';
import { PageProvider } from '@utils/ui-utils/PageProvider';

export interface CaseData {
  subject?: string;
  description?: string;
  status?: string;
  priority?: string;
  caseorigin?: string;
  type?: string;
  casereason?: string;
  product?: string;
  internalcomments?: string;
}

/**
 * Contact actions to create a contact in Salesforce.
 * Optional data can be passed, otherwise TestDataFactory is used.
 */
export class CaseActions {

  static async caseCreation(
    data?: CaseData,
    dataSource?: DataSource  // <-- allow test to override
  ) {
    // If no explicit dataSource, default to 'synthetic'
    const source: DataSource = dataSource ?? 'synthetic';

    // Fetch synthetic or SOQL data if no args provided
    if (!data) {
      data = await TestDataFactory.getData('case', source);
      if (!data) {
        throw new Error('Failed to fetch contact data from TestDataFactory');
      }
    }

    const page = PageProvider.page;
    const casePage = new CasePage(page);

    await casePage.click(casePage.casesLink);
    await casePage.click(casePage.newCaseButton);

    await casePage.selectPicklistValue("Status", data.status!);
    await casePage.selectPicklistValue("Priority", data.priority!);
    await casePage.selectPicklistValue("Case Origin", data.caseorigin!);
    await casePage.selectPicklistValue("Type", data.type!);
    await casePage.selectPicklistValue("Case Reason", data.casereason!);
    // await casePage.selectPicklistValue("Product", data.product!);

    await casePage.fill(casePage.subjectTextBox, data.subject!);
    await casePage.fill(casePage.descriptionTextBox, data.description!);
    await casePage.fill(casePage.internalCommentsTextBox, data.internalcomments!);

    await casePage.click(casePage.saveButton);
  }
}
