import { TestTags } from '@data/enums/test-tags.enums';
import { SoqlQueries } from '@data/constants/query-constants';
import { expect, test } from '@fixtures/api-fixtures';


// --------------------------------------------------------
// Test 1: Verify successful case creation via API
// --------------------------------------------------------
test('Verify case creation via API', {
  tag: [TestTags.SMOKE],
  annotation: [
    { type: 'Feature', description: 'Case Management' },
    { type: 'Priority', description: 'High' }
  ]
}, async ({ apiClient }) => {
  // Step 1: Create a new case
  const newCase = {
    Subject: `Test Case ${Date.now()}`,
    Description: 'Test case description',
    Status: 'New',
    Priority: 'High',
  };

  // Step 2: Verify case creation was successful
  const result = await apiClient.createRecord('Case', newCase);
  expect(result.id).toBeTruthy();
});


// --------------------------------------------------------
// Test 2: Verify successful case update via API
// --------------------------------------------------------
test('Verify case update via API', {
  tag: [TestTags.SMOKE],
  annotation: [
    { type: 'Feature', description: 'Case Management' },
    { type: 'Priority', description: 'High' }
  ]
}, async ({ apiClient }) => {
  // Step 1: Fetch an existing case
  const cases = await apiClient.executeQuery(SoqlQueries.Case.GET_SINGLE_CASE);
  
  if (cases.length === 0) return;

  // Step 2: Update the case status
  const caseId = cases[0].Id;
  await apiClient.updateRecord('Case', caseId, { Status: 'Closed' });

  // Step 3: Verify the case was updated
  const updated = await apiClient.executeQuery(
    `SELECT Status FROM Case WHERE Id = '${caseId}' LIMIT 1`
  );
  expect(updated[0].Status).toBe('Closed');
});