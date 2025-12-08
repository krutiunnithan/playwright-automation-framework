// import { test, expect } from '@playwright/test';
// import axios from 'axios';
// import dotenv from 'dotenv';
// import path from 'path';

// dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// test('Verify OAuth session injection into Lightning', async ({ page, context }) => {
//   const username = process.env.SF_TEST_USERNAME;
//   const password = process.env.SF_TEST_PASSWORD;
//   const clientId = process.env.SF_CLIENT_ID;
//   const clientSecret = process.env.SF_CLIENT_SECRET;
//   const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
//   const orgUrl = process.env.SF_ORG_URL || 'https://drive-page-4627.my.salesforce.com';

//   console.log('=== ENV VARS ===');
//   console.log('username:', username);
//   console.log('password:', password ? '***' : 'MISSING');
//   console.log('clientId:', clientId?.substring(0, 20) + '...');
//   console.log('clientSecret:', clientSecret ? '***' : 'MISSING');
//   console.log('loginUrl:', loginUrl);

//   if (!username || !password || !clientId || !clientSecret) {
//     throw new Error(`Missing env vars`);
//   }

//   const params = new URLSearchParams();
//   params.append('grant_type', 'password');
//   params.append('client_id', clientId);
//   params.append('client_secret', clientSecret);
//   params.append('username', username);
//   params.append('password', password);

//   console.log('=== REQUESTING TOKEN ===');
//   console.log('URL:', `${loginUrl}/services/oauth2/token`);
//   console.log('grant_type:', 'password');

//   try {
//     const tokenResp = await axios.post(`${loginUrl}/services/oauth2/token`, params.toString(), {
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//       validateStatus: () => true, // don't throw on 400
//     });

//     console.log('=== TOKEN RESPONSE ===');
//     console.log('Status:', tokenResp.status);
//     console.log('Data:', JSON.stringify(tokenResp.data, null, 2));

//     if (tokenResp.status !== 200) {
//       throw new Error(`OAuth failed: ${JSON.stringify(tokenResp.data)}`);
//     }

//     const accessToken = tokenResp.data.access_token;
//     const instanceUrl = tokenResp.data.instance_url;

//     console.log('✓ Access token received');
//     console.log('Instance URL:', instanceUrl);

//     const hostname = new URL(instanceUrl).hostname;
//     await page.goto(instanceUrl, { waitUntil: 'domcontentloaded' });

//     await context.addCookies([{
//       name: 'sid',
//       value: accessToken,
//       domain: hostname,
//       path: '/',
//       httpOnly: true,
//       secure: true,
//       sameSite: 'None' as const,
//     }]);

//     console.log('✓ Session cookie injected');
//     await page.goto(`${orgUrl}/lightning/page/home`, { waitUntil: 'networkidle' });

//     const profileButton = page.getByRole('button', { name: /view profile|profile/i });
//     await expect(profileButton).toBeVisible({ timeout: 10000 });

//     console.log('✅ Successfully authenticated into Lightning without OTP!');
//   } catch (error: any) {
//     console.error('❌ ERROR:', error.response?.data || error.message || error);
//     throw error;
//   }
// });