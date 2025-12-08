/**
 * ============================================================================
 * Gmail OTP Retrieval + DynamoDB Claiming (SHARED INBOX + USERNAME MATCHING)
 * ============================================================================
 * - All OTPs arrive in ONE shared Gmail inbox (abc@gmail.com)
 * - Each email body contains "Username: user@email.com" identifying the recipient
 * - Workers extract username from body and match to their assigned user
 * - Uses DynamoDB atomic claiming to prevent duplicate OTP usage
 */

import { google } from 'googleapis';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const DEFAULT_DDB_TABLE = process.env.OTP_DDB_TABLE || 'OTPClaims';
const DEFAULT_REGION = process.env.AWS_REGION || 'ap-southeast-2';

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
 * - DynamoDB atomic claiming prevents another worker from using the same OTP
 * 
 * @param userEmail - The assigned username/email for THIS worker (e.g., kru3581@gmail.com)
 */
export async function fetchSalesforceOTPFromGmail(
  testRunId: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  searchQuery = 'from:noreply@salesforce.com subject:"Verify your identity"',
  timeoutMs = 60_000,
  loginSubmitTime: number = Date.now(),
  userEmail?: string  // <-- THIS WORKER'S ASSIGNED USERNAME
): Promise<string> {
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
  const maxMessagesToFetch = 10; // Fetch more since all OTPs are in one inbox

  console.log(`[OTP] testRunId: ${testRunId}`);
  console.log(`[OTP] Worker username: ${userEmail}`);
  console.log(`[OTP] Fetching OTP from shared inbox (matching username in email body)...`);

  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  while (Date.now() - pollStartTime < timeoutMs) {
    await pause(pollIntervalMs);

    let messagesRes;
    try {
      // Query the shared inbox (no recipient filter needed)
      messagesRes = await gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,  // <-- SEARCHES ENTIRE SHARED INBOX
        maxResults: maxMessagesToFetch,
      });
      consecutiveErrors = 0; // Reset error counter on success
    } catch (err: any) {
      consecutiveErrors++;
      const errorMsg = err?.message ?? String(err);
      console.error(`[OTP] Gmail API error (attempt ${consecutiveErrors}): ${errorMsg}`);

      // If it's an invalid_grant error, this is a token issue
      if (errorMsg.includes('invalid_grant')) {
        console.error('[OTP] ⚠️  CRITICAL: Gmail refresh token is INVALID or EXPIRED');
        console.error('[OTP] Please regenerate the Gmail refresh token:');
        console.error('[OTP]   1. Go to Google Cloud Console');
        console.error('[OTP]   2. Re-authorize the app to get a new refresh token');
        console.error('[OTP]   3. Update AWS Secrets: playwright/gmail-otp-creds → gmailRefreshToken');
        
        // Stop retrying if it's a token issue
        throw new Error(`Gmail token invalid: ${errorMsg}`);
      }

      // For other errors, continue retrying
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

    // Fetch full message details
    const messagesWithData: { id: string; body: string }[] = [];
    for (const m of messagesRes.data.messages) {
      if (!m.id) continue;
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: m.id,
          format: 'full',
        });

        const body = extractBody(msgRes?.data?.payload);
        if (body?.trim()) {
          messagesWithData.push({ id: m.id, body });
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

    console.log(`[OTP] Processing ${messagesWithData.length} message(s), matching username...`);

    // Try to claim each message (in order from Gmail: newest first)
    for (const item of messagesWithData) {
      // Extract 6-digit OTP from body
      const otpMatch = item.body.match(/\b\d{6}\b/);
      if (!otpMatch) {
        console.log(`[OTP] Message ${item.id} has no 6-digit OTP, skipping`);
        continue;
      }

      // Extract username from body (look for "Username: user@email.com")
      const usernameMatch = item.body.match(/Username:\s*([^\n]+)/i);
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

      console.log(`[OTP] ✓ Found OTP for ${userEmail}: ${otp}`);

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
    `Check: 1) Gmail credentials valid, 2) OTP email sent, 3) Username matches in email body`
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