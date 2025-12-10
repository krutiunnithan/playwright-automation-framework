/**
 * ============================================================================
 * Gmail OTP Retrieval + DynamoDB Claiming (SHARED INBOX + USERNAME MATCHING)
 * ============================================================================
 * - All OTPs arrive in ONE shared Gmail inbox (abc@gmail.com)
 * - Each email body contains "Username: user@email.com" identifying the recipient
 * - Workers extract username from body and match to their assigned user
 * - Uses DynamoDB atomic claiming to prevent duplicate OTP usage
 * - Filters by timestamp to ensure LATEST OTP is used (sent after login attempt)
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { google } from 'googleapis';

const DEFAULT_DDB_TABLE = process.env.OTP_DDB_TABLE || 'OTPClaims';
const DEFAULT_REGION = process.env.AWS_REGION || 'ap-southeast-2';

// Regex patterns compiled once (not recreated in loops)
const OTP_REGEX = /\b\d{6}\b/;
const USERNAME_REGEX = /Username:\s*([^\n]+)/i;

export function generateTestRunId(): string {
  return `run_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Fetch Salesforce OTP from Gmail with DynamoDB atomic claiming
 * 
 * CRITICAL LOGIC:
 * - All OTPs go to ONE shared inbox (abc@gmail.com)
 * - Each email body contains "Username: user@email.com"
 * - This worker passes its assigned username (userEmail param)
 * - We search through OTPs and find the one whose body matches this worker's username
 * - TIMESTAMP FILTER: Only consider OTPs sent AFTER login attempt (prevents stale OTPs)
 * - DynamoDB atomic claiming prevents another worker from using the same OTP
 * 
 * @param userEmail - The assigned username/email for THIS worker (e.g., kru3581@gmail.com)
 * @param loginSubmitTime - Timestamp when login was submitted (ms since epoch)
 */
export async function fetchSalesforceOTPFromGmail(
  testRunId: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  searchQuery = 'from:noreply@salesforce.com subject:"Verify your identity"',
  timeoutMs = 60_000,
  loginSubmitTime: number = Date.now(),
  userEmail?: string
): Promise<string> {
  // Validate inputs
  if (!clientId || !clientSecret) {
    throw new Error('Google clientId/clientSecret required');
  }
  if (!refreshToken) {
    throw new Error('Google refreshToken required - please regenerate in AWS Secrets Manager');
  }
  if (!testRunId) {
    throw new Error('testRunId is required');
  }
  if (!userEmail) {
    throw new Error('userEmail (this worker\'s assigned username) is required for shared inbox matching');
  }

  const dynamoTableName = process.env.OTP_DDB_TABLE || DEFAULT_DDB_TABLE;
  const dynamo = new DynamoDBClient({ region: DEFAULT_REGION });

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const pollStartTime = Date.now();
  const pollIntervalMs = 1500;
  const maxMessagesToFetch = 10;
  const maxConsecutiveErrors = 3;

  console.log(`[OTP] testRunId: ${testRunId}`);
  console.log(`[OTP] Worker username: ${userEmail}`);
  console.log(`[OTP] Login submit time: ${new Date(loginSubmitTime).toISOString()}`);
  console.log(`[OTP] Fetching OTP from shared inbox (matching username in email body, timestamp after login)...`);

  let consecutiveErrors = 0;

  while (Date.now() - pollStartTime < timeoutMs) {
    await pause(pollIntervalMs);

    let messagesRes;
    try {
      messagesRes = await gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults: maxMessagesToFetch,
      });
      consecutiveErrors = 0;
    } catch (err: any) {
      const errorMsg = err?.message ?? String(err);

      if (errorMsg.includes('invalid_grant')) {
        console.error('[OTP] CRITICAL: Gmail refresh token is INVALID or EXPIRED');
        console.error('[OTP] Please regenerate the Gmail refresh token:');
        console.error('[OTP]   1. Go to Google Cloud Console');
        console.error('[OTP]   2. Re-authorize the app to get a new refresh token');
        console.error('[OTP]   3. Update AWS Secrets: playwright/gmail-otp-creds → gmailRefreshToken');
        throw new Error(`Gmail token invalid: ${errorMsg}`);
      }

      consecutiveErrors++;
      console.error(`[OTP] Gmail API error (attempt ${consecutiveErrors}/${maxConsecutiveErrors}): ${errorMsg}`);

      if (consecutiveErrors >= maxConsecutiveErrors) {
        throw new Error(`Too many Gmail API errors: ${errorMsg}`);
      }
      continue;
    }

    if (!messagesRes?.data?.messages?.length) {
      const elapsed = Date.now() - pollStartTime;
      console.log(`[OTP] No messages found yet (${elapsed}ms elapsed)`);
      continue;
    }

    console.log(`[OTP] Found ${messagesRes.data.messages.length} message(s) in shared inbox`);

    // Fetch full message details (sequential - not parallel to maintain order and prevent rate limiting)
    const messagesWithData: { id: string; body: string; timestamp: number }[] = [];

    for (const m of messagesRes.data.messages) {
      if (!m.id) continue;

      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: m.id,
          format: 'full',
        });
        const body = extractBody(msgRes?.data?.payload);

        // internalDate is in milliseconds (already)
        const timestamp = parseInt(msgRes?.data?.internalDate || '0', 10);

        if (body?.trim()) {
          messagesWithData.push({ id: m.id, body, timestamp });
          console.log(`[OTP] Message ${m.id} fetched (timestamp: ${new Date(timestamp).toISOString()})`);
        }
      } catch (err: any) {
        console.warn(`[OTP] Failed to fetch message ${m.id}:`, err?.message ?? err);
        continue;
      }
    }

    if (!messagesWithData.length) {
      const elapsed = Date.now() - pollStartTime;
      console.log(`[OTP] No valid messages with bodies found (${elapsed}ms elapsed)`);
      continue;
    }

    console.log(`[OTP] Processing ${messagesWithData.length} message(s), matching username and timestamp...`);

    // Try to claim each message (newest first - Gmail returns in descending order)
    for (const item of messagesWithData) {
      // ✅ TIMESTAMP FILTER: Only accept OTPs sent AFTER login attempt
      if (item.timestamp < loginSubmitTime) {
        console.log(
          `[OTP] Message ${item.id} is OLDER than login attempt (${new Date(item.timestamp).toISOString()} < ${new Date(loginSubmitTime).toISOString()}), skipping (stale OTP)`
        );
        continue;
      }

      const otpMatch = item.body.match(OTP_REGEX);
      if (!otpMatch) {
        console.log(`[OTP] Message ${item.id} has no 6-digit OTP, skipping`);
        continue;
      }

      const usernameMatch = item.body.match(USERNAME_REGEX);
      if (!usernameMatch) {
        console.log(`[OTP] Message ${item.id} has no Username field, skipping`);
        continue;
      }

      const otpUsername = usernameMatch[1].trim();
      const otp = otpMatch[0];
      const messageId = item.id;

      // CRITICAL: Check if this OTP belongs to THIS worker's username
      if (otpUsername !== userEmail) {
        console.log(
          `[OTP] Message ${messageId} is for user "${otpUsername}", not "${userEmail}", skipping`
        );
        continue;
      }

      console.log(`[OTP] ✓ Found VALID OTP for ${userEmail}: ${otp} (timestamp: ${new Date(item.timestamp).toISOString()})`);

      // Try to atomically claim this OTP
      try {
        await dynamo.send(
          new PutItemCommand({
            TableName: dynamoTableName,
            Item: {
              MessageId: { S: messageId },
              TestRunId: { S: testRunId },
              Otp: { S: otp },
              Username: { S: otpUsername },
              ClaimedAt: { S: new Date().toISOString() },
              MessageTimestamp: { N: String(item.timestamp) },
            },
            ConditionExpression: 'attribute_not_exists(MessageId)',
          })
        );

        console.log(`[OTP] ✓ Successfully claimed OTP ${otp} in DynamoDB`);
        return otp;
      } catch (err: any) {
        if (err?.message?.includes('ConditionalCheckFailed')) {
          console.log(`[OTP] Message ${messageId} already claimed by another worker, trying next...`);
          continue;
        }
        console.warn(`[OTP] DynamoDB claim failed:`, err?.message ?? err);
        continue;
      }
    }
  }

  const totalElapsed = Date.now() - pollStartTime;
  throw new Error(
    `Failed to fetch Salesforce OTP from Gmail after ${totalElapsed}ms (timeout: ${timeoutMs}ms). ` +
    `Check: 1) Gmail credentials valid, 2) OTP email sent AFTER login, 3) Username matches in email body, 4) Stagger delays sufficient (STAGGER_DELAY_MS)`
  );
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractBody(payload: any): string {
  if (!payload) return '';

  // Try to get text/plain part
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }

  // Fallback to direct body
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  return '';
}