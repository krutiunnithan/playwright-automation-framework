import { test, expect } from '@fixtures/pom-fixtures';
import { CaseValidations } from "@validations/CaseValidations";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { TestTags } from "@data/enums/test-tags.enums";

test('Verify case creation as a case manager', { tag: TestTags.SMOKE }, async ({loginPage, casePage}) => {
  
  test.setTimeout(60000 * 2);

  await loginPage.login(UserProfiles.CASE_MANAGER);

  // should have optional args 
  await casePage.createCase();

  // Generalize below toast msg logic 
  await CaseValidations.validateCaseCreation();
});

