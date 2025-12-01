import { test, expect } from '@fixtures/pom-fixtures';
import { ContactValidations } from "@validations/ContactValidations";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { TestTags } from "@data/enums/test-tags.enums";

test('Verify contact creation as a case manager', { tag: TestTags.SMOKE }, async ({loginPage, contactPage}) => {
  await loginPage.login(UserProfiles.CASE_MANAGER);

  // should have optional args 
  await contactPage.createContact();

  // Generalize below toast msg logic 
  await ContactValidations.validateContactCreation();
});

