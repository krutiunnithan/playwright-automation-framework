import { CasePage } from '@pages/CasePage';
import { DataSource, TestDataFactory } from '@utils/data-utils/TestDataFactory';
import { PageProvider } from '@utils/ui-utils/PageProvider';


/**
 * ============================================================================
 * CaseData Interface
 * ----------------------------------------------------------------------------
 * Defines the structure of the case data used for creating a Case record
 * in Salesforce.
 *
 * All fields are optional because:
 *   - Tests may override only specific fields
 *   - TestDataFactory can populate missing values
 * ============================================================================
 */
export interface CaseData {
  subject?: string;
  description?: string;
  status?: string;
  priority?: string;
  caseOrigin?: string;
  type?: string;
  caseReason?: string;
  product?: string;
  internalComments?: string;
}

/**
 * Case actions to create a case in Salesforce.
 * Optional data can be passed, otherwise TestDataFactory is used.
 */
export class CaseCreation {


  /**
 * ==========================================================================
 * caseCreation
 * --------------------------------------------------------------------------
 * Creates a Salesforce Case using UI steps.
 *
 * @param data        Optional CaseData object
 * @param dataSource  Optional DataSource enum ('synthetic', 'soql', ...)
 *
 * Behavior:
 *   - If `data` is not provided, TestDataFactory generates values
 *   - If `dataSource` not provided, defaults to 'synthetic'
 *   - Fills all fields and picklists using CasePage
 *
 * Throws:
 *   - Error if TestDataFactory fails to produce data
 * ==========================================================================
 */
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
        throw new Error('Failed to fetch case data from TestDataFactory');
      }
    }

    const page = PageProvider.page;
    const casePage = new CasePage(page);

    await casePage.click(casePage.casesLink);
    await casePage.click(casePage.newCaseButton);

    await casePage.selectPicklistValue("Status", data.status!);
    await casePage.selectPicklistValue("Priority", data.priority!);
    await casePage.selectPicklistValue("Case Origin", data.caseOrigin!);
    await casePage.selectPicklistValue("Type", data.type!);
    await casePage.selectPicklistValue("Case Reason", data.caseReason!);

    await casePage.fill(casePage.subjectTextBox, data.subject!);
    await casePage.fill(casePage.descriptionTextBox, data.description!);
    await casePage.fill(casePage.internalCommentsTextBox, data.internalComments!);

    await casePage.click(casePage.saveButton);
  }
}
