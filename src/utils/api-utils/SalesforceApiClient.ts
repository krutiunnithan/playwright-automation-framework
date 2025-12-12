/**
 * ============================================================================
 * Salesforce API Client - Client Credentials Flow
 * ============================================================================
 * Simple OAuth2 server-to-server authentication.
 */

import { getSalesforceOAuthCreds } from '@utils/aws-utils/AwsSecrets';

export class SalesforceApiClient {
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private clientId: string;
  private clientSecret: string;
  private orgUrl: string;

  private constructor(
    clientId: string,
    clientSecret: string,
    orgUrl: string
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.orgUrl = orgUrl;
  }

  /**
   * Static factory - creates authenticated client
   */
  static async create(): Promise<SalesforceApiClient> {
    try {
      const creds = await getSalesforceOAuthCreds();
      return new SalesforceApiClient(creds.clientId, creds.clientSecret, creds.orgUrl);
    } catch (err) {
      throw new Error(`Failed to create API client: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Client Credentials authentication
   */
  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${this.orgUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Auth failed: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      this.accessToken = data.access_token;
      this.instanceUrl = data.instance_url;
    } catch (err) {
      throw new Error(`Authentication failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Execute SOQL query 
   */
  async executeQuery(soqlQuery: string): Promise<any[]> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const encodedQuery = encodeURIComponent(soqlQuery);
      const response = await fetch(
        `${this.instanceUrl}/services/data/v60.0/query?q=${encodedQuery}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      return (await response.json()).records || [];
    } catch (err) {
      throw new Error(`SOQL failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Create a new record
   */
  async createRecord(sObjectType: string, data: any): Promise<{ id: string }> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const response = await fetch(
        `${this.instanceUrl}/services/data/v60.0/sobjects/${sObjectType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Sforce-Duplicate-Rule-Header': 'allowSave=true',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Create failed: ${error}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      throw new Error(`Record creation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Update an existing record
   */
  async updateRecord(sObjectType: string, recordId: string, data: any): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const response = await fetch(
        `${this.instanceUrl}/services/data/v60.0/sobjects/${sObjectType}/${recordId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Update failed: ${error}`);
      }
    } catch (err) {
      throw new Error(`Record update failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}