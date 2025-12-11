import { SoqlQueries } from '@data/constants/query-constants';
import { expect, test } from '@fixtures/api-fixtures';

test('Should create a new case', async ({ apiClient }) => {
  const newCase = {
    Subject: `Test Case ${Date.now()}`,
    Description: 'Test case description',
    Status: 'New',
    Priority: 'High',
  };

  const result = await apiClient.createRecord('Case', newCase);
  expect(result.id).toBeTruthy();
});

test('Should update an existing case', async ({ apiClient }) => {
  const cases = await apiClient.executeQuery(SoqlQueries.Case.GET_ALL);
  
  if (cases.length === 0) return;

  const caseId = cases[0].Id;
  await apiClient.updateRecord('Case', caseId, { Status: 'Closed' });

  const updated = await apiClient.executeQuery(
    `SELECT Status FROM Case WHERE Id = '${caseId}' LIMIT 1`
  );
  expect(updated[0].Status).toBe('Closed');
});