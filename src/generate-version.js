const fs = require('fs');
const path = require('path');

const version = Date.now(); // You could also use Git commit hash here

// Fix: Ensure the output path is correct for your project structure
// If your 'public' folder is at the root of the project, adjust the path as below:
const filePath = path.resolve(__dirname, '..', 'public', 'version.json');
fs.writeFileSync(filePath, JSON.stringify({ version }));

console.log('✅ version.json generated with version:', version);
