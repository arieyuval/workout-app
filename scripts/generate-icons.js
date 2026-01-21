const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../public/plates-logo.png');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons from plates-logo.png...\n');

  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 24, g: 24, b: 27, alpha: 1 } // #18181b - zinc-900
      })
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));

    console.log(`  Generated icon-${size}x${size}.png`);
  }

  // Generate maskable icon with safe zone padding (icon should be ~80% of total size)
  // Safe zone is the inner 80%, so we need padding on all sides
  const maskableSize = 512;
  const iconSize = Math.floor(maskableSize * 0.7); // Icon at 70% to ensure safe zone
  const padding = Math.floor((maskableSize - iconSize) / 2);

  await sharp(inputPath)
    .resize(iconSize, iconSize, {
      fit: 'contain',
      background: { r: 24, g: 24, b: 27, alpha: 1 }
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 24, g: 24, b: 27, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'maskable-icon-512x512.png'));

  console.log('  Generated maskable-icon-512x512.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
