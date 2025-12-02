import { TestTags } from "@data/enums/test-tags.enums";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { test } from '@fixtures/pom-fixtures';
import { ContactValidations } from "@validations/ContactValidations";

test('Verify contact creation as a case manager', { tag: TestTags.SMOKE }, async ({ loginPage, contactPage }) => {

  test.setTimeout(60000 * 2);

  await loginPage.login(UserProfiles.CASE_MANAGER);
  await contactPage.createContact();
  await ContactValidations.validateContactCreation();
});

