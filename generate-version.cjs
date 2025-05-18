// generate-version.cjs
const fs = require('fs');
const path = require('path');

const version = Date.now();
const filePath = path.resolve(__dirname, 'public', 'version.json');

fs.writeFileSync(filePath, JSON.stringify({ version }));

console.log('✅ version.json generated with version:',filePath, version);
