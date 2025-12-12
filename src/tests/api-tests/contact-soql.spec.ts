import { SoqlQueries } from '@data/constants/query-constants';
import { TestTags } from '@data/enums/test-tags.enums';
import { expect, test } from '@fixtures/api-fixtures';

// --------------------------------------------------------
// Test 1: Verify successful contact fetch via SOQL
// --------------------------------------------------------
test('Verify contact fetch via API', {
  tag: [TestTags.REGRESSION],
  annotation: [
    { type: 'Feature', description: 'Contact Management' },
    { type: 'Priority', description: 'Low' }
  ]
}, async ({ apiClient }) => {
  // Step 1: Execute SOQL query to fetch a contact
  const records = await apiClient.executeQuery(SoqlQueries.Contact.GET_SINGLE_CONTACT);

  // Step 2: Verify contact records are returned
  expect(Array.isArray(records)).toBe(true);
  if (records.length > 0) {
    expect(records[0]).toHaveProperty('Id');
    expect(records[0]).toHaveProperty('FirstName');
  }
});

// --------------------------------------------------------
// Test 2: Verify successful fetch of recent contacts
// --------------------------------------------------------
test('Verify fetch of recent contacts via API', {
  tag: [TestTags.REGRESSION],
  annotation: [
    { type: 'Feature', description: 'Contact Management' },
    { type: 'Priority', description: 'Low' }
  ]
}, async ({ apiClient }) => {
  // Step 1: Execute SOQL query to fetch recent contacts
  const records = await apiClient.executeQuery(SoqlQueries.Contact.GET_RECENT(5));

  // Step 2: Verify recent contacts are returned
  expect(Array.isArray(records)).toBe(true);
});

// --------------------------------------------------------
// Test 3: Verify successful contact creation via API
// --------------------------------------------------------
test('Verify contact creation via API', {
  tag: [TestTags.SMOKE],
  annotation: [
    { type: 'Feature', description: 'Contact Management' },
    { type: 'Priority', description: 'High' }
  ]
}, async ({ apiClient }) => {
  // Step 1: Create a new contact
  const newContact = {
    FirstName: 'Test',
    LastName: `Contact_${Date.now()}`,
    Email: `test.contact.${Date.now()}@example.com`,
    Phone: '+1234567890',
  };

  // Step 2: Verify contact creation was successful
  const result = await apiClient.createRecord('Contact', newContact);

  expect(result.id).toBeTruthy();
});

// --------------------------------------------------------
// Test 4: Verify successful contact update via API
// --------------------------------------------------------
test('Verify contact update via API', {
  tag: [TestTags.SMOKE],
  annotation: [
    { type: 'Feature', description: 'Contact Management' },
    { type: 'Priority', description: 'High' }
  ]
}, async ({ apiClient }) => {
  // Step 1: Fetch an existing contact
  const contacts = await apiClient.executeQuery(SoqlQueries.Contact.GET_SINGLE_CONTACT);

  if (contacts.length === 0) {
    return;
  }

  // Step 2: Update the contact phone number
  const contactId = contacts[0].Id;
  const updateData = {
    Phone: '+9876543210',
  };

  await apiClient.updateRecord('Contact', contactId, updateData);

  // Step 3: Verify the contact was updated
  const updated = await apiClient.executeQuery(
    `SELECT Phone FROM Contact WHERE Id = '${contactId}' LIMIT 1`
  );

  expect(updated[0].Phone).toBe('+9876543210');
});