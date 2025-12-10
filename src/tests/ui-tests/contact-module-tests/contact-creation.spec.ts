import { TestTags } from "@data/enums/test-tags.enums";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { test } from '@fixtures/pom-fixtures';
import { ContactValidations } from "@validations/ContactValidations";

// -----------------------------------------------------------
// Test 1: Verify successful contact creation as Case Manager
// -----------------------------------------------------------
test('Verify contact creation as a case manager', {
  tag: [TestTags.SMOKE],
  annotation: [
    { type: 'Feature', description: 'Contact Management' },
    { type: 'Priority', description: 'High' }
  ]
}, async ({ page, loginPage, contactPage }) => {

  // Step 1: Login using Case Manager credentials
  await loginPage.login(UserProfiles.CASE_MANAGER);

  // Step 2: Perform contact creation
  await contactPage.createContact();

  // Step 3: Validate contact is created
  await ContactValidations.validateContactCreation();
});

