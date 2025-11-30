/**
 * ============================================================================
 * AWS Secrets Utility
 * ----------------------------------------------------------------------------
 * Provides helper functions for:
 * - Assuming an AWS role with STS
 * - Fetching environment-specific user credentials
 * - Retrieving Gmail/other secrets from AWS Secrets Manager
 *
 * Implements caching of STS temporary credentials for efficiency.
 * ============================================================================
 */
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

/** Duration for STS temporary credentials (12 hours) */
const STS_DURATION = 12 * 60 * 60;

/**
 * ============================================================================
 * CachedCredentials
 * ----------------------------------------------------------------------------
 * Interface for storing temporary STS credentials in memory
 * ============================================================================
 */
interface CachedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

// In-memory cache for temporary credentials
let cachedCreds: CachedCredentials | null = null;

// STS client for assuming roles
const sts = new AWS.STS({ region: process.env.AWS_REGION });


/**
 * ============================================================================
 * assumeRole
 * ----------------------------------------------------------------------------
 * Assumes an AWS role using STS and caches the temporary credentials in memory.
 *
 * @param {string} roleArn - ARN of the AWS role to assume
 * @returns {Promise<AWS.SecretsManager>} AWS SecretsManager client initialized with temporary credentials
 * ============================================================================
 */
async function assumeRole(roleArn: string): Promise<AWS.SecretsManager> {
  const now = new Date();

  if (!cachedCreds || now >= cachedCreds.expiration) {

    // Refresh credentials if expired or not present
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

  // Return a SecretsManager client with cached credentials
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
 * ----------------------------------------------------------------------------
 * Fetches user credentials for a given environment and profile from AWS Secrets Manager.
 *
 * @param {string} env - Target environment (e.g., 'dev', 'qa', 'prod')
 * @param {string} userProfile - Profile name (e.g., 'case manager')
 * @returns {Promise<{username: string, password: string}>} Environment-specific user credentials
 * ============================================================================
 */
export async function getUserCreds(env: string, userProfile: string) {
  const roleArn = process.env.AWS_SECRETS_ROLE_ARN!;
  const secretsManager = await assumeRole(roleArn);

  const secretName = "playwright/test-user-credentials";
  const secretVal = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

  if (!secretVal.SecretString) throw new Error('SecretString is empty in AWS Secrets Manager');

  const allProfiles = JSON.parse(secretVal.SecretString);
  if (!allProfiles[env]) throw new Error(`Environment "${env}" not found in secret`);

  const key = userProfile.replace(/\s+/g, '').toLowerCase();
  if (!allProfiles[env][key]) throw new Error(`Profile "${userProfile}" not found in environment "${env}"`);

  return allProfiles[env][key];
}

AWS.config.update({ region: process.env.AWS_REGION });

/**
 * ============================================================================
 * getGmailSecrets
 * ----------------------------------------------------------------------------
 * Retrieves Gmail (or other) secrets from AWS Secrets Manager.
 *
 * @param {string} secretName - Name of the secret in AWS Secrets Manager
 * @returns {Promise<any>} Parsed JSON object of the secret
 * ============================================================================
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


// Code for SSO login on local and IAM Role via OIDC on pipeline - No STS calls

// import { SecretsManager } from 'aws-sdk';

// /**
//  * Fetch credentials for a given environment and profile.
//  * AWS credentials are automatically taken from:
//  * - AWS SSO (local)
//  * - OIDC / IAM Role (pipeline)
//  * - EC2 / Lambda role (runtime)
//  */
// export async function getUserCreds(env: string, userProfile: string) {
//   const sm = new SecretsManager({
//     region: process.env.AWS_REGION,
//   });

//   // your secret name stays the same
//   const secretName = "playwright/test-user-credentials";
//   const secretVal = await sm.getSecretValue({ SecretId: secretName }).promise();

//   if (!secretVal.SecretString) {
//     throw new Error("SecretString is empty in AWS Secrets Manager");
//   }

//   const allProfiles = JSON.parse(secretVal.SecretString);

//   if (!allProfiles[env]) {
//     throw new Error(`Environment "${env}" not found in secrets`);
//   }

//   // normalize keys
//   const key = userProfile.replace(/\s+/g, '').toLowerCase();

//   // map your secret format:
//   // CaseManager, SystemAdmin, AccommodationsManager
//   const foundProfile = Object.keys(allProfiles[env]).find(
//     k => k.toLowerCase() === key
//   );

//   if (!foundProfile) {
//     throw new Error(`Profile "${userProfile}" not found in environment "${env}"`);
//   }

//   return allProfiles[env][foundProfile]; // { username, password }
// }
