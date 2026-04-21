const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkg = require('./package.json');
let sha = '';
try {
  sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // git may be unavailable (e.g. CI without git, or not a repo)
}

const version = sha ? `${pkg.version}+${sha}` : pkg.version;

const filePath = path.resolve(__dirname, 'public', 'version.json');
fs.writeFileSync(filePath, JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2));

console.log('version.json generated with version:', version);
