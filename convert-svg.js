const fs = require('fs');
const path = require('path');

// Read SVG content
const svgPath = path.join(__dirname, 'public', 'assets', 'logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Create data URL
const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');

console.log('SVG file read successfully');
console.log('To convert to JPG, please use one of these methods:');
console.log('');
console.log('1. Online converter:');
console.log('   - Visit https://cloudconvert.com/svg-to-jpg');
console.log('   - Upload: ' + svgPath);
console.log('');
console.log('2. Open convert-logo.html in browser:');
console.log('   - File location: ' + path.join(__dirname, 'convert-logo.html'));
console.log('   - Click "Convert to JPG" then "Download JPG"');
console.log('');
console.log('3. Using ImageMagick (if installed):');
console.log('   magick convert -background white -flatten "public/assets/logo.svg" "public/assets/logo.jpg"');
