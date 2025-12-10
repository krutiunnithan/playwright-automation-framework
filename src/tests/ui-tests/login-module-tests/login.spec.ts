import { TestTags } from "@data/enums/test-tags.enums";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { test } from '@fixtures/pom-fixtures';
import { LoginValidations } from "@validations/LoginValidations";


// ------------------------------------------------------
// Test 1: Verify successful login as Case Manager
// ------------------------------------------------------
test('Login as Case Manager and verify successful login', {
  tag: [TestTags.SMOKE],
  annotation: [
    { type: 'Feature', description: 'Authentication' },
    { type: 'Priority', description: 'High' }
  ]
}, async ({ page, loginPage }) => {

  // Step 1: Login using Case Manager credentials
  await loginPage.login(UserProfiles.CASE_MANAGER);

  // Step 2: Validate dashboard is displayed
  await LoginValidations.validateDashboard(page);
});


// ------------------------------------------------------
// Test 2: Login → Logout → Login as another user
// ------------------------------------------------------
test('Login as Case Manager and Re-login as System Admin', {
  tag: [TestTags.REGRESSION],
  annotation: [
    { type: 'Feature', description: 'Authentication' },
    { type: 'Priority', description: 'Medium' }
  ]
}, async ({ page, loginPage }) => {

  // Step 1: Login as Case Manager
  await loginPage.login(UserProfiles.CASE_MANAGER);

  // Step 2: Logout
  await loginPage.logout();

  // Step 3: Login as System Admin
  await loginPage.login(UserProfiles.SYSTEM_ADMIN);

  // Step 4: Validate dashboard is displayed
  await LoginValidations.validateDashboard(page);
});


// ------------------------------------------------------
// Test 3: Validate unsuccessful login for invalid profile
// ------------------------------------------------------
test('Login as Accommodations Manager and verify unsuccessful login failure', {
  tag: [TestTags.REGRESSION],
  annotation: [
    { type: 'Feature', description: 'Authentication' },
    { type: 'Priority', description: 'Medium' }
  ]
}, async ({ page, loginPage }) => {

  // Step 1: Login using invalid (not permitted) profile
  await loginPage.login(UserProfiles.ACCOMMODATIONS_MANAGER);

  // Step 2: Validate login failure message
  await LoginValidations.validateLoginFailure(page);
});
