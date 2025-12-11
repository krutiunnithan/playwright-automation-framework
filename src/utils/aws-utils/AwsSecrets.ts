/**
 * ============================================================================
 * AWS Secrets Manager
 * ============================================================================
 * Centralized credential fetching from AWS Secrets Manager.
 */

const AWS = require('aws-sdk');

let cachedSecretsManager: any = null;

async function assumeRole(roleArn: string): Promise<any> {
  if (cachedSecretsManager) return cachedSecretsManager;

  const sts = new AWS.STS();
  const assumedRole = await sts
    .assumeRole({
      RoleArn: roleArn,
      RoleSessionName: 'playwright-test-session',
    })
    .promise();

  const credentials = assumedRole.Credentials;
  if (!credentials) throw new Error('No credentials in assumed role response');

  const region = process.env.AWS_REGION || 'ap-southeast-2';
  
  cachedSecretsManager = new AWS.SecretsManager({
    region: region,
    accessKeyId: credentials.AccessKeyId,
    secretAccessKey: credentials.SecretAccessKey,
    sessionToken: credentials.SessionToken,
  });

  return cachedSecretsManager;
}

async function getSalesforceOAuthCreds(): Promise<{
  clientId: string;
  clientSecret: string;
  orgUrl: string;
}> {
  const roleArn = process.env.AWS_SECRETS_ROLE_ARN!;
  const secretsManager = await assumeRole(roleArn);

  try {
    const secretValue = await secretsManager
      .getSecretValue({ SecretId: 'playwright/salesforce-oauth' })
      .promise();

    const secret = JSON.parse(secretValue.SecretString || '{}');
    console.log('Fetched Salesforce OAuth credentials from AWS Secrets Manager');
    return {
      clientId: secret.salesforceClientId,
      clientSecret: secret.salesforceClientSecret,
      orgUrl: secret.salesforceOrgUrl || 'https://login.salesforce.com',
    };
  } catch (err) {
    throw new Error(
      `Failed to fetch Salesforce OAuth creds: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function getUserCreds(
  env: string,
  profile: string,
  workerIndex: number
): Promise<{ username: string; password: string }> {
  const roleArn = process.env.AWS_SECRETS_ROLE_ARN!;
  const secretsManager = await assumeRole(roleArn);

  try {
    const secretValue = await secretsManager
      .getSecretValue({ SecretId: 'playwright/test-user-credentials' })
      .promise();

    const secret = JSON.parse(secretValue.SecretString || '{}');
    const envUsers = secret[env]?.[profile] || [];

    if (envUsers.length === 0) {
      throw new Error(`No users found for ${env}/${profile}`);
    }

    const userIndex = workerIndex % envUsers.length;
    const user = envUsers[userIndex];

    console.log(`[getUserCreds] Worker ${workerIndex} → "${profile}" → user #${userIndex} (${user.username})`);

    return {
      username: user.username,
      password: user.password,
    };
  } catch (err) {
    throw new Error(
      `Failed to fetch user credentials: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

async function getGmailSecrets(secretId: string): Promise<{
  gmailClientId: string;
  gmailClientSecret: string;
  gmailRefreshToken: string;
}> {
  const roleArn = process.env.AWS_SECRETS_ROLE_ARN!;
  const secretsManager = await assumeRole(roleArn);

  try {
    const secretValue = await secretsManager
      .getSecretValue({ SecretId: secretId })
      .promise();

    const secret = JSON.parse(secretValue.SecretString || '{}');
    console.log('Fetched Gmail OTP credentials from AWS Secrets Manager');
    return {
      gmailClientId: secret.gmailClientId,
      gmailClientSecret: secret.gmailClientSecret,
      gmailRefreshToken: secret.gmailRefreshToken,
    };
  } catch (err) {
    throw new Error(
      `Failed to fetch Gmail secrets: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

module.exports = {
  getSalesforceOAuthCreds,
  getUserCreds,
  getGmailSecrets,
};