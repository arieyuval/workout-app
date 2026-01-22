const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../public/plates-logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Dark background color matching your app theme
const bgColor = { r: 24, g: 24, b: 27, alpha: 1 }; // #18181b - zinc-900

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons from plates-logo.png...\n');

  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: bgColor
      })
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

    console.log(`  Generated icon-${size}x${size}.png`);
  }

  // Generate maskable icon for Android adaptive icons
  // The logo should be ~60-70% of the canvas so it stays in the safe zone
  // but the background fills the entire icon (no white border)
  const maskableSize = 512;
  const logoSize = Math.floor(maskableSize * 0.65); // Logo at 65% size

  // First create the background, then composite the logo on top
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: bgColor
    }
  })
    .composite([
      {
        input: await sharp(inputPath)
          .resize(logoSize, logoSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent
          })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(outputDir, 'maskable-icon-512x512.png'));

  console.log('  Generated maskable-icon-512x512.png');

  // Also generate 192 maskable version
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: bgColor
    }
  })
    .composite([
      {
        input: await sharp(inputPath)
          .resize(Math.floor(192 * 0.65), Math.floor(192 * 0.65), {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(outputDir, 'maskable-icon-192x192.png'));

  console.log('  Generated maskable-icon-192x192.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
