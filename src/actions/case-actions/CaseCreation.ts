import { AppRoutes } from '@data/constants/app-routes';
import { CaseFormFields } from '@data/constants/form-fields';
import { DataSource } from '@data/enums/data-sources.enums';
import { SalesforceModule } from '@data/enums/modules.enums';
import { CasePage } from '@pages/CasePage';
import { TestDataFactory } from '@utils/data-utils/TestDataFactory';
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
 *
 * Behavior:
 *   - If `data` is not provided, TestDataFactory generates values
 *   - Fills all fields and picklists using CasePage
 *
 * Throws:
 *   - Error if TestDataFactory fails to produce data
 * ==========================================================================
 */
  static async caseCreation(data?: CaseData) {
    try {
      // Use synthetic by default
      if (!data) {
        data = await TestDataFactory.getData(SalesforceModule.CASE, DataSource.SYNTHETIC);
        if (!data) {
          throw new Error('Failed to fetch case data from TestDataFactory');
        }
      }

      const page = await PageProvider.getPage();
      const casePage = new CasePage(page);

      // Navigate to case list view
      await page.goto(AppRoutes.CASE_LIST, { waitUntil: 'domcontentloaded' });

      // Case creation steps
      await casePage.click(casePage.newCaseButton);

      await casePage.selectPicklistValue(CaseFormFields.STATUS, data.status!);
      await casePage.selectPicklistValue(CaseFormFields.PRIORITY, data.priority!);
      await casePage.selectPicklistValue(CaseFormFields.CASE_ORIGIN, data.caseOrigin!);
      await casePage.selectPicklistValue(CaseFormFields.TYPE, data.type!);
      await casePage.selectPicklistValue(CaseFormFields.CASE_REASON, data.caseReason!);

      await casePage.fill(casePage.subjectTextBox, data.subject!);
      await casePage.fill(casePage.descriptionTextBox, data.description!);
      await casePage.fill(casePage.internalCommentsTextBox, data.internalComments!);

      await casePage.click(casePage.saveButton);
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
