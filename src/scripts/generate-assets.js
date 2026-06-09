const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../../public/logo.svg');
const publicDir = path.join(__dirname, '../../public');

async function generate() {
  const svgBuffer = fs.readFileSync(logoPath);

  // Generate 192x192 PWA Icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // Generate 512x512 PWA Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // Generate 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-icon.png'));
  console.log('Generated apple-icon.png');

  // Generate 32x32 Favicon Icon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');
}

generate().catch(err => {
  console.error('Error generating assets:', err);
});
