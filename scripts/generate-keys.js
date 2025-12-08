const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const keyDir = path.join(__dirname, '..', 'sf_keys');
if (!fs.existsSync(keyDir)) fs.mkdirSync(keyDir, { recursive: true });

try {
  const privateKeyPath = path.join(keyDir, 'sf_private.pem');
  const certPath = path.join(keyDir, 'sf_cert.pem');
  
  // Use forward slashes and proper quoting for Windows + Git Bash
  const cmd = `openssl req -x509 -newkey rsa:2048 -keyout "${privateKeyPath}" -out "${certPath}" -days 730 -nodes -subj "/CN=playwright-jwt"`;
  
  console.log('Generating X.509 certificate with OpenSSL...');
  console.log('Command:', cmd);
  
  execSync(cmd, { 
    stdio: 'inherit',
    shell: 'bash'  // Force bash shell on Windows
  });
  
  console.log('✅ X.509 Certificate generated:');
  console.log('  Private key:', privateKeyPath);
  console.log('  Public cert:', certPath);
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error('\nAlternative: Use Git Bash manually:');
  console.error('  1. Right-click project folder → Git Bash Here');
  console.error('  2. cd sf_keys');
  console.error('  3. openssl req -x509 -newkey rsa:2048 -keyout sf_private.pem -out sf_cert.pem -days 730 -nodes -subj "/CN=playwright-jwt"');
  process.exit(1);
}