const fs = require('fs');
const html = fs.readFileSync('dist/app.html', 'utf8');
const idMatches = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
console.log('Total IDs:', idMatches.length);
console.log('Filtered IDs:', idMatches.filter(id => 
  id.includes('step') || id.includes('dob') || id.includes('btn') || id.includes('Btn') || 
  id.includes('preview') || id.includes('Draft') || id.includes('asset') || id.includes('beneficiary') || 
  id.includes('executor') || id.includes('modal') || id.includes('Modal')
));
