/**
 * ============================================================================
 * ContactValidations
 * ----------------------------------------------------------------------------
 * Centralized validation methods for the Contact module.
 * 
 * Purpose:
 * - Separates UI validation logic from Page Object Model (POM) logic.
 * - Provides reusable assertions for test cases.
 * ============================================================================
 */
import { GenericValidations } from '@validations/GenericValidations';

export class ContactValidations {

  /**
   * ==========================================================================
   * validateContactCreation
   * ----------------------------------------------------------------------------
   * Validates that the contact creation toast message appears.
   * @param expectedMessage - The message text you expect to see
   * @throws {Error} If the toast message does not match expected message
   * ==========================================================================
   */
  //   static async validateContactCreation(firstName: string, lastName: string) {
  //     const regex = new RegExp(`Contact .* was created`, "i");
  //     await GenericValidations.validateToastMessage(regex);
  //   }
  static async validateContactCreation() {
    const regex = new RegExp(`Contact .* was created`, "i");
    await GenericValidations.validateToastMessage(regex);
  }
}