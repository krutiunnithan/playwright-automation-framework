import { test, expect } from '@fixtures/pom-fixtures';
import { LoginValidations } from "@validations/LoginValidations";


test('Verify contact creation as a case manager', {tag: '@Smoke',}, async ({loginPage, contactPage}) => {
  await loginPage.login('case manager');
  await contactPage.createContact(); 
  // assert successful contact creation 
  
});

