import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const pdfPath = path.resolve('./src/assests/RSAT.pdf');
const outPath = path.resolve('./src/assests/RSAT.txt');

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
  fs.writeFileSync(outPath, data.text, 'utf8');
}).catch(err => {
  console.error('PDF extraction failed:', err);
  process.exit(1);
});
