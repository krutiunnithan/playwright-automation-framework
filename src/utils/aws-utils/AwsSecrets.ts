/**
 * ============================================================================
 * AWS Secrets Utility
 * ============================================================================
 * Fetches environment-specific user credentials and secrets from AWS Secrets Manager.
 * Supports per-worker user distribution for parallel test execution.
 * Works on local (SSO) and CI (IAM Role/OIDC).
 */
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const STS_DURATION = 12 * 60 * 60;

interface CachedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

let cachedCreds: CachedCredentials | null = null;
const sts = new AWS.STS({ region: process.env.AWS_REGION });

/**
 * Assumes an AWS role using STS and caches temporary credentials
 */
async function assumeRole(roleArn: string): Promise<AWS.SecretsManager> {
  const now = new Date();

  if (!cachedCreds || now >= cachedCreds.expiration) {
    const res = await sts
      .assumeRole({
        RoleArn: roleArn,
        RoleSessionName: 'PlaywrightSession',
        DurationSeconds: STS_DURATION,
      })
      .promise();

    if (!res.Credentials) throw new Error('Failed to assume role');

    cachedCreds = {
      accessKeyId: res.Credentials.AccessKeyId!,
      secretAccessKey: res.Credentials.SecretAccessKey!,
      sessionToken: res.Credentials.SessionToken!,
      expiration: res.Credentials.Expiration!,
    };
  }

  return new AWS.SecretsManager({
    region: process.env.AWS_REGION,
    accessKeyId: cachedCreds.accessKeyId,
    secretAccessKey: cachedCreds.secretAccessKey,
    sessionToken: cachedCreds.sessionToken,
  });
}

/**
 * ============================================================================
 * getUserCreds
 * ============================================================================
 * Fetches user credentials and distributes per worker for parallel execution.
 *
 * If profileData is an array (multi-user), selects: user[workerIndex % array.length]
 * This ensures each worker gets a unique user if available.
 *
 * @param env - Environment (dev, sit, uat)
 * @param userProfile - Profile name (Case Manager, System Admin, etc.)
 * @param workerIndex - Worker index (0, 1, 2...) for distribution
 * @returns User credentials { username, password }
 */
export async function getUserCreds(
  env: string,
  userProfile: string,
  workerIndex: number = 0
) {
  const roleArn = process.env.AWS_SECRETS_ROLE_ARN!;
  const secretsManager = await assumeRole(roleArn);

  const secretName = 'playwright/test-user-credentials';
  const secretVal = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

  if (!secretVal.SecretString) {
    throw new Error('SecretString is empty in AWS Secrets Manager');
  }

  const allProfiles = JSON.parse(secretVal.SecretString);

  if (!allProfiles[env]) {
    throw new Error(`Environment "${env}" not found in secret`);
  }

  const key = userProfile.replace(/\s+/g, '').toLowerCase();
  const profileData = allProfiles[env][key];

  if (!profileData) {
    throw new Error(`Profile "${userProfile}" not found in environment "${env}"`);
  }

  // DISTRIBUTE USERS PER WORKER
  if (Array.isArray(profileData)) {
    const userIndex = workerIndex % profileData.length;
    const selected = profileData[userIndex];
    console.log(
      `[getUserCreds] Worker ${workerIndex} → "${userProfile}" → user #${userIndex} (${selected.username})`
    );
    return selected;
  }

  console.log(`[getUserCreds] Worker ${workerIndex} → "${userProfile}" → single user (${profileData.username})`);
  return profileData;
}

AWS.config.update({ region: process.env.AWS_REGION });

/**
 * ============================================================================
 * getGmailSecrets
 * ============================================================================
 * Retrieves Gmail OAuth credentials from AWS Secrets Manager
 */
export async function getGmailSecrets(secretName: string) {
  const client = new AWS.SecretsManager();

  try {
    const data = await client.getSecretValue({ SecretId: secretName }).promise();
    if (!data.SecretString) throw new Error('SecretString is empty');
    return JSON.parse(data.SecretString);
  } catch (err) {
    console.error(`Failed to fetch secret ${secretName}:`, err);
    throw err;
  }
}