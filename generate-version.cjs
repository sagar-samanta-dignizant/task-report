const fs = require('fs');
const path = require('path');

const customVersion = "0.0.8";
const version = customVersion || Date.now();

const filePath = path.resolve(__dirname, 'public', 'version.json');
fs.writeFileSync(filePath, JSON.stringify({ version }, null, 2));

console.log('✅ version.json generated with version:', version);
