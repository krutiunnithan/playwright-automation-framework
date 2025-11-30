import { google } from 'googleapis';

export async function fetchSalesforceOTPFromGmail(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  searchQuery = 'from:noreply@salesforce.com subject:"Verify your identity in Salesforce"',
  timeoutMs = 60000
): Promise<string> {
  
  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const start = Date.now();

  while (Date.now() - start < timeoutMs) {

    // 🔍 Step 1: List Gmail threads
    const threadsRes = await gmail.users.threads.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 1,
    });

    console.log("1", threadsRes.status);

    if (!threadsRes.data.threads?.length) {
      await pause(3000);
      continue;
    }

    const threadId = threadsRes.data.threads[0].id!;
    console.log("2", threadId);

    // 📩 Step 2: Fetch FULL thread
    const threadRes = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full'
    });

    console.log("3", threadRes.status);

    if (!threadRes.data.messages?.length) {
      await pause(3000);
      continue;
    }

    // 🆕 Step 3: Latest message = last in the array
    const latestMsg = threadRes.data.messages[threadRes.data.messages.length - 1];
    console.log("4 MESSAGE FOUND");

    // 🧩 Step 4: Extract full body (recursive)
    const body = extractBody(latestMsg.payload);
    console.log("5 BODY:", body);

    // 🧪 Step 5: Extract OTP
    const match = body?.match(/Verification Code:\s*(\d{6})/);
    console.log("6 MATCH:", match);

    if (match) return match[1];

    await pause(3000);
  }

  throw new Error("Salesforce OTP not received within timeout");
}


// ------------------ HELPERS ---------------------

function pause(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * Recursively extract Gmail message text/plain or text/html
 */
function extractBody(payload: any): string {
  if (!payload) return "";

  // CASE 1: Direct body
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }

  // CASE 2: Multipart body → search all nested parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text.trim() !== "") return text;
    }
  }

  return "";
}
