import { TestTags } from "@data/enums/test-tags.enums";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { test } from '@fixtures/pom-fixtures';
import { CaseValidations } from "@validations/CaseValidations";

test('Verify case creation as a case manager', { tag: TestTags.SMOKE }, async ({ loginPage, casePage }) => {

  test.setTimeout(60000 * 2);

  await loginPage.login(UserProfiles.CASE_MANAGER);
  await casePage.createCase();
  await CaseValidations.validateCaseCreation();
});

