import { TestTags } from "@data/enums/test-tags.enums";
import { UserProfiles } from "@data/enums/user-profiles.enums";
import { expect, test } from '@fixtures/pom-fixtures';
import { LoginValidations } from "@validations/LoginValidations";


// ------------------------------------------------------
// Test 1: Validate unsuccessful login for invalid profile
// ------------------------------------------------------
test('Login as Accommodations Manager and verify unsuccessful login failure', { tag: TestTags.SMOKE }, async ({ page, loginPage }) => {

  // Step 1: Login using invalid (not permitted) profile
  await loginPage.login(UserProfiles.ACCOMMODATIONS_MANAGER);

  // Step 2: Validate login failure message
  await LoginValidations.validateLoginFailure(page);  
});


// ------------------------------------------------------
// Test 2: Login → Logout → Login as another user
// ------------------------------------------------------
test('Login as Case Manager and Re-login as System Admin', { tag: TestTags.REGRESSION }, async ({ page, loginPage }) => {

  // Step 1: Login as Case Manager
  await loginPage.login(UserProfiles.CASE_MANAGER);

  // Step 2: Logout
  await loginPage.logout();

  // Step 3: Login as System Admin
  await loginPage.login(UserProfiles.SYSTEM_ADMIN);

  // Step 4: Validate dashboard is displayed
  expect(page).toHaveTitle(/Salesforce|Lightning Experience/i, { timeout: 30000 });
  console.log('VALIDATED that dashboard is displayed...');
});


// ------------------------------------------------------
// Test 3: Verify successful login as Case Manager
// ------------------------------------------------------
test('Login as Case Manager and verify successful login', { tag: TestTags.SMOKE }, async ({ page, loginPage }) => {

  // Step 1: Login using Case Manager credentials
  await loginPage.login(UserProfiles.CASE_MANAGER);

  // Step 2: Validate dashboard is displayed
  expect(page).toHaveTitle(/Salesforce|Lightning Experience/i, { timeout: 30000 });
  console.log('VALIDATED that dashboard is displayed...');
});