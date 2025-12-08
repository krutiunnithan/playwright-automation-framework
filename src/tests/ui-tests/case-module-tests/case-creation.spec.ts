import { TestTags } from "@data/enums/test-tags.enums";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { test } from '@fixtures/pom-fixtures';
import { CaseValidations } from "@validations/CaseValidations";

// --------------------------------------------------------
// Test 1: Verify successful case creation as Case Manager
// --------------------------------------------------------
test('Verify case creation as a case manager', { tag: TestTags.SMOKE }, async ({ page, loginPage, casePage }) => {

  // Step 1: Login using Case Manager credentials
  await loginPage.login(UserProfiles.CASE_MANAGER);

  // Step 2: Perform contact creation
  await casePage.createCase();

  // Step 3: Validate contact is created
  await CaseValidations.validateCaseCreation();
});

