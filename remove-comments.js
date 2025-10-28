const fs = require('fs');

// Read the file
const filePath = 'src/lib/hooks/meeting/useQuestionsHooks.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Remove block comments /* ... */
code = code.replace(/\/\*[^]*?\*\//g, '');

// Write back to file
fs.writeFileSync(filePath, code);

console.log('Comments removed successfully!');