import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const STS_DURATION = 12 * 60 * 60; // 12 hours

interface CachedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

// In-memory cache
let cachedCreds: CachedCredentials | null = null;

// STS client to assume role
const sts = new AWS.STS({ region: process.env.AWS_REGION });

// Cache-aware role assumption
async function assumeRole(roleArn: string): Promise<AWS.SecretsManager> {
  const now = new Date();

  if (!cachedCreds || now >= cachedCreds.expiration) {

    // fetch new temporary credentials
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

  // return a SecretsManager client with cached creds
  return new AWS.SecretsManager({
    region: process.env.AWS_REGION,
    accessKeyId: cachedCreds.accessKeyId,
    secretAccessKey: cachedCreds.secretAccessKey,
    sessionToken: cachedCreds.sessionToken,
  });
}

/**
 * Fetch credentials for a given environment and profile.
 * Uses cached STS creds.
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
