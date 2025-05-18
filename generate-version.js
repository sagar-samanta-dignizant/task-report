const fs = require('fs');
const path = require('path');

const version = Date.now(); // You could also use Git commit hash here

// Write version.json to the public folder in the root directory
const filePath = path.resolve(__dirname, 'public', 'version.json');
fs.writeFileSync(filePath, JSON.stringify({ version }));

console.log('✅ version.json generated with version:', version);
