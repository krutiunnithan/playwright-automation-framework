/**
 * ============================================================================
 * Gmail OTP Retrieval Utility
 * ----------------------------------------------------------------------------
 * Fetch Salesforce OTP from Gmail using Google API OAuth2 authentication.
 * Supports:
 *  - Email thread search
 *  - Dynamic polling until OTP appears
 *  - Multi-part email payloads (text/plain and text/html)
 * ============================================================================
 */
import { google } from 'googleapis';

/**
 * ============================================================================
 * fetchSalesforceOTPFromGmail
 * ----------------------------------------------------------------------------
 * Retrieves a 6-digit OTP sent by Salesforce via Gmail.
 *
 * @author Kruti Unnithan
 *
 * @param {string} clientId       - Google OAuth2 Client ID
 * @param {string} clientSecret   - Google OAuth2 Client Secret
 * @param {string} refreshToken   - Refresh token for Gmail API access
 * @param {string} [searchQuery]  - Gmail search filter (default = Salesforce OTP email)
 * @param {number} [timeoutMs]    - Timeout in milliseconds before failing (default: 60000)
 *
 * @returns {Promise<string>}     - Extracted 6-digit OTP from the latest email in the thread
 * ============================================================================
 */
export async function fetchSalesforceOTPFromGmail(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  searchQuery = 'from:noreply@salesforce.com subject:"Verify your identity in Salesforce"',
  timeoutMs = 60000
): Promise<string> {

  // ---------------------------------------------------------------------------
  // Step 0: Initialize OAuth2 client for Gmail API
  // ---------------------------------------------------------------------------

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  const start = Date.now();


  // ---------------------------------------------------------------------------
  // Step 1: Poll Gmail until OTP is found or timeout is reached
  // ---------------------------------------------------------------------------
  while (Date.now() - start < timeoutMs) {

    // STEP 1a: List Gmail threads matching search query
    const threadsRes = await gmail.users.threads.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 1,
    });


    if (!threadsRes.data.threads?.length) {
      await pause(3000);
      continue;
    }

    const threadId = threadsRes.data.threads[0].id!;

    // STEP 1b: Fetch full thread details
    const threadRes = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full'
    });


    if (!threadRes.data.messages?.length) {
      await pause(3000);
      continue;
    }

    // STEP 1c: Use latest message in the thread
    const latestMsg = threadRes.data.messages[threadRes.data.messages.length - 1];

    // STEP 1d: Extract email body (handles multi-part MIME recursively)
    const body = extractBody(latestMsg.payload);

    // STEP 1e: Extract 6-digit OTP from email body
    const match = body?.match(/Verification Code:\s*(\d{6})/);

    // Return OTP
    if (match) return match[1];

    // Wait before polling again
    await pause(3000);
  }

  throw new Error("Salesforce OTP not received within timeout");
}


/**
 * ============================================================================
 * pause
 * ----------------------------------------------------------------------------
 * Simple sleep/pause helper to delay execution for a specified duration
 *
 * @param {number} ms - Milliseconds to pause
 * @returns {Promise<void>}
 * ============================================================================
 */

function pause(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * ============================================================================
 * extractBody
 * ----------------------------------------------------------------------------
 * Recursively extracts UTF-8 text from Gmail message payload, handling:
 *  - Direct plain text body
 *  - HTML body
 *  - Multi-part MIME messages with nested parts
 *
 * @param {any} payload - Gmail message payload
 * @returns {string}    - Decoded text content
 * ============================================================================
 */
function extractBody(payload: any): string {
  if (!payload) return "";

  // CASE 1: Direct data in body
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }

  // CASE 2: Multi-part MIME → recursively traverse parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text.trim() !== "") return text;
    }
  }

  return "";
}
