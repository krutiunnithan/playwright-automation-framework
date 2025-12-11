/**
 * ============================================================================
 * Contact SOQL API Tests
 * ============================================================================
 * Tests hit Salesforce API directly.
 * No UI - pure API calls.
 */

import { SoqlQueries } from '@data/constants/query-constants';
import { expect, test } from '@fixtures/api-fixtures';

test('Should fetch a contact via SOQL', async ({ apiClient }) => {
  const records = await apiClient.executeQuery(SoqlQueries.Contact.GET_SINGLE_CONTACT);

  expect(Array.isArray(records)).toBe(true);
  if (records.length > 0) {
    expect(records[0]).toHaveProperty('Id');
    expect(records[0]).toHaveProperty('FirstName');
  }
});

test('Should fetch recent contacts', async ({ apiClient }) => {
  const records = await apiClient.executeQuery(SoqlQueries.Contact.GET_RECENT(5));

  expect(Array.isArray(records)).toBe(true);
});


test('Should create a new contact', async ({ apiClient }) => {
  const newContact = {
    FirstName: 'Test',
    LastName: `Contact_${Date.now()}`,
    Email: `test.contact.${Date.now()}@example.com`,
    Phone: '+1234567890',
  };

  const result = await apiClient.createRecord('Contact', newContact);

  expect(result.id).toBeTruthy();
  console.log(`Created contact: ${result.id}`);
});

test('Should update an existing contact', async ({ apiClient }) => {
  // First get a contact to update
  const contacts = await apiClient.executeQuery(SoqlQueries.Contact.GET_SINGLE_CONTACT);
  
  if (contacts.length === 0) {
    console.log('No contacts to update - skipping test');
    return;
  }

  const contactId = contacts[0].Id;
  const updateData = {
    Phone: '+9876543210',
  };

  await apiClient.updateRecord('Contact', contactId, updateData);

  // Verify update
  const updated = await apiClient.executeQuery(
    `SELECT Phone FROM Contact WHERE Id = '${contactId}' LIMIT 1`
  );

  expect(updated[0].Phone).toBe('+9876543210');
  console.log(`Updated contact: ${contactId}`);
});