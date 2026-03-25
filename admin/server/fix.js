const fs = require('fs');
let content = fs.readFileSync('.env', 'utf-8');
const saKeyMatch = content.match(/FIREBASE_SERVICE_ACCOUNT='([\s\S]+?)'/);
if (saKeyMatch) {
  let sa = JSON.parse(saKeyMatch[1]);
  // Replace literal \r, \n with just \n so stringify will produce valid "\n" inside string
  if (typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\r/g, '').replace(/\\n/g, '\n');
  }
  const saString = JSON.stringify(sa);
  const newContent = content.replace(saKeyMatch[0], `FIREBASE_SERVICE_ACCOUNT='${saString}'`);
  fs.writeFileSync('.env', newContent);
  console.log('Successfully fixed .env');
} else {
  console.log('FIREBASE_SERVICE_ACCOUNT not found in .env');
}
