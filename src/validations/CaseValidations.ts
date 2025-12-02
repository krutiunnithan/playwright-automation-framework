/**
 * ============================================================================
 * CaseValidations
 * ----------------------------------------------------------------------------
 * Centralized validation methods for the Case module.
 * 
 * Purpose:
 * - Separates UI validation logic from Page Object Model (POM) logic.
 * - Provides reusable assertions for test cases.
 * ============================================================================
 */
import { GenericValidations } from '@validations/GenericValidations';

export class CaseValidations {

  /**
   * ==========================================================================
   * validateCaseCreation
   * ----------------------------------------------------------------------------
   * Validates that the casae creation toast message appears.
   * @throws {Error} If the toast message does not match expected message
   * ==========================================================================
   */
  static async validateCaseCreation() {
    const regex = new RegExp(`Case .* was created`, "i");
    await GenericValidations.validateToastMessage(regex);
  }
}