const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

(async () => {
  try {
    console.log('🔐 Desktop Client Token Regeneration');
    console.log('====================================');
    console.log('');

    // Get credentials from user
    const clientId = await question('Enter your Client ID: ');
    const clientSecret = await question('Enter your Client Secret: ');

    if (!clientId || !clientSecret) {
      console.error('❌ Client ID and Secret are required');
      process.exit(1);
    }

    // Use urn:ietf:wg:oauth:2.0:oob for Desktop apps (no redirect needed)
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log('');
    console.log('📋 Authorization URL:');
    console.log('');
    console.log(authUrl);
    console.log('');
    console.log('📝 Instructions:');
    console.log('  1. Copy the URL above');
    console.log('  2. Paste in your browser');
    console.log('  3. Sign in with your Gmail account');
    console.log('  4. Click "Allow"');
    console.log('  5. Copy the authorization CODE (long string shown on page)');
    console.log('  6. Paste it here');
    console.log('');

    const authCode = await question('Paste the authorization code: ');

    if (!authCode || authCode.trim().length === 0) {
      console.error('❌ Authorization code is required');
      process.exit(1);
    }

    console.log('');
    console.log('🔄 Exchanging code for tokens...');

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(authCode.trim());

      console.log('✅ Refresh token obtained!');
      console.log('');
      console.log('📋 Your Credentials:');
      console.log('====================================');
      console.log(`Client ID: ${clientId}`);
      console.log(`Client Secret: ${clientSecret}`);
      console.log(`Refresh Token: ${tokens.refresh_token}`);
      console.log('====================================');
      console.log('');
      console.log('📝 Next steps:');
      console.log('  1. Go to AWS Secrets Manager');
      console.log('  2. Update secret: playwright/gmail-otp-creds');
      console.log('  3. Update with these values');
      console.log('');
      console.log('JSON to paste:');
      console.log('{');
      console.log(`  "gmailClientId": "${clientId}",`);
      console.log(`  "gmailClientSecret": "${clientSecret}",`);
      console.log(`  "gmailRefreshToken": "${tokens.refresh_token}"`);
      console.log('}');
      console.log('');

      rl.close();
    } catch (err) {
      console.error('❌ Invalid authorization code or error exchanging:', err.message);
      rl.close();
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    rl.close();
    process.exit(1);
  }
})();