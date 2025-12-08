require('dotenv').config({ path: '.env' });
const axios = require('axios');
const jwt = require('jsonwebtoken');


async function testJwt() {
  const clientId = process.env.SF_CLIENT_ID || '3MVG9QJ.PEcCek9ZsgSRvw8w_Ex7F7S0p4XxnLRyHjO7rWhVxNdTdLiy9kPh0P1zbiOFGyy0zAoCVT2hpM1Qa';
  const privateKey = process.env.SF_PRIVATE_KEY_PEM || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMDYotZnksXNwu 8pnd27qVeOiqXGSuVuHwMh+CkcE34zP6DoKglFt8UlpROWaNrf4Wahb6tlV3/pyi gisGGXgSuYYgDFyJ1w+DAG34JvIVWslpMNZtwiA08Ymc+oDbybwFY9ctLvgnXwYz 7CVyznJBW9qgigRopJbBmrrsmgUTVaFjf3g+2m573KtcRBR3fmipv/hXeojf/31N 83uvpCuv6hJUrac9/pGcp8VEkwQkh5wOIEXKTIaC/3Vi+Vf9JirLiYRQeUMMeV77 xSyFaBaQxsm6oetnZpHsdwT1DDK81/AgT7zckf3/Lm/4PybgpEQgXiqN6fITH6fz 9CilwSI3AgMBAAECggEAAfcQjwbMwRV5kV2bB3OnslliT6iN16pCiQ3t8pzQu0J7 dWAsrwRaLA3CaFZqCP4eik8Bh+7cc0g93e0RRrfC7kRgREvjUorLYgUEd9DBWBPg CK8Ek+u8Gxi09kd7T+uySv5slO303mnpSaq40HXxp73EJPOmLFz019x4LqjZofLf 5c+VyuBx47BbSsC6+sUhOwkHKnPnNkBevlKDRBh60PcKpwkinj+aGJBqK2xIQqXt z5qQdF4gVjg/JrA9DDFDWMKw188hJ1cJVk9VrHQSGeeXF2AilWvBWa51xUE1HMzh AnKlZ5HVP6PhkrxFG8n8J89k2hetPWiJGefeIIUDYQKBgQDya8w/oZUGg392qfXx gf3/6Tdwm8qvhljz3yiNx4MtyL/uoFgT8nXzg4+X6aiB6hw6p0f0rS3vfvt+FOvy /toEcIdRtaAHBaohLxPNgT1AQdMlTZJOGCwmIQzNXyBe8BTMUM63lvy2uoP7IxiR V38E9Kz8KBXwMnUzWy/YEHDYjwKBgQDXe490zjI0k6wTkM3W6AOYjCmI/J1xVaXm ympUGzkwxZ1BzeqEmGUhrmKDLeItXgliK7R7uxK3F7Y6QeZUtb2PktolEycvb5zJ XSqZKbQOpAYg2OuW4kU70CCeJc6XEhFTmSzx1KsU1pN7Tdr4tpgdpVO8zXNk/JIH IkhMt7vf2QKBgG2I36TwsZFb4UAQ05voDIiRLAepnQ9qOM8YSg6l01PgnTiJIsMA juMU0tDlNspcqZym8RBRH6xTR/dUJLiLBp9y6PG2izQhDxonV19HwhFCrNDyF+VJ bslbrZkuHkZHXF5lNMInatB1viS/Wt5xFmd61p6oziDV67bkwN1zsElpAoGBAKaF kCk+J8JF1JcSMmA/0HeU6Yw5XBp3i8u85Uq19w5fyNVPokpx0sWik/K4BK/2md3J 1KJBwYbIxkRjJPKVuDY50GcSVBfucwWSABd5CPK/gxTjTby+g65jerF8mhhZGBa4 quj/5m4mHLcPRYcq5IcUeo/PXbvPC7KDpcfTvVaRAoGBAKJ8HfA1C0bgVplj97T1 eY/XKp1v9E3oK+8Dje472vwBPY3VT6se1XyoftcFMuXgCv2Nui6inTiKieoxEonm B266NHD0ZZT0bMo05bmKGtxpLkSg9hAhQEHd8NSMM/0gFMGffkDcJqKtl1ELsvmU ZnZ1CvNDxF3Tu4BwnAQcYjCG\n-----END PRIVATE KEY-----";
  const username = process.env.SF_TEST_USERNAME || 'krutiunnithan24484@agentforce.com';
  const loginUrl = process.env.SF_LOGIN_URL || 'https://test.salesforce.com';

  // fail fast if secrets missing
  console.log('*******************************************************************************clientId:', clientId.substring(0, 10) + '...');
  if (!clientId || !privateKey) {
    console.error('Missing SF_CLIENT_ID or SF_PRIVATE_KEY_PEM in .env — please add them to the .env file.');
    process.exit(1);
  }

  console.log('Testing JWT flow...');
  console.log('clientId:', clientId.substring(0, 10) + '...');
  console.log('username:', username);
  console.log('loginUrl:', loginUrl);

  try {
    // 1. Create JWT assertion
    const now = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: clientId,
        sub: username,
        aud: loginUrl,
        exp: now + 3 * 60,
      },
      privateKey,
      { algorithm: 'RS256' }
    );

    console.log('\n✓ JWT assertion created');

    // 2. Exchange JWT for access token
    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', assertion);

    const response = await axios.post(`${loginUrl}/services/oauth2/token`, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, instance_url } = response.data;
    console.log('\n✓ Access token received');
    console.log('instance_url:', instance_url);

    // 3. Test SOQL query
    const soqlResponse = await axios.get(
      `${instance_url}/services/data/v58.0/query?q=SELECT Id FROM Account LIMIT 1`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    console.log('\n✓ SOQL query successful');
    console.log('Records found:', soqlResponse.data.totalSize);
    console.log('\n✅ ALL TESTS PASSED!');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      //console.error(error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error('\n❌ ERROR:', error.message);
    } else {
      console.error('\n❌ ERROR:', error);
    }
    process.exit(1);
  }
}

testJwt();