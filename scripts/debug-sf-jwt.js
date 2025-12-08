const axios = require('axios');
require('dotenv').config({ path: '.env' });

(async () => {
  const username = process.env.SF_TEST_USERNAME;
  const password = process.env.SF_TEST_PASSWORD; // add this to .env
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET; // add this to .env
  const loginUrl = process.env.SF_LOGIN_URL || 'https://test.salesforce.com';

  try {
    const resp = await axios.post(`${loginUrl}/services/oauth2/token`, 
      new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, validateStatus: () => true }
    );

    console.log('HTTP', resp.status);
    console.log('response.data:', JSON.stringify(resp.data, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message || err);
  }
})();