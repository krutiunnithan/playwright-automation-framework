import { test, expect } from '@fixtures/pom-fixtures';
import { LoginValidations } from "@validations/LoginValidations";


test('Login as Case Manager', {tag: '@Smoke',}, async ({ loginPage}) => {
  await loginPage.login('case manager');

  // add assertion
  await LoginValidations.validateDashboard();
});


// add mutiple profile login and logout with assertion 