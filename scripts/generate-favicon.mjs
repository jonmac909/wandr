import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const inputPath = join(projectRoot, 'WhatsApp Image 2026-01-08 at 11.01.52.jpeg');
const publicDir = join(projectRoot, 'public');
const iconsDir = join(publicDir, 'icons');

// Primary color from globals.css: oklch(0.65 0.2 25)
// Converting to RGB: approximately #e85d4c (warm coral/red)
const PRIMARY_COLOR = { r: 232, g: 93, b: 76 }; // Coral/red matching the app primary

async function generateFavicons() {
  console.log('Processing image...');

  // Load the image
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`Input: ${metadata.width}x${metadata.height}`);

  // The image has a black rounded rect background with white globe
  // Extract the center portion containing the globe
  const size = Math.min(metadata.width, metadata.height);
  const extractSize = Math.floor(size * 0.75);
  const offset = Math.floor((size - extractSize) / 2);

  // Extract center portion (just the globe, no box)
  const extracted = await image
    .extract({
      left: offset + 50,
      top: offset + 50,
      width: extractSize - 100,
      height: extractSize - 100
    })
    .png()
    .toBuffer();

  // Generate favicon sizes with primary color tint (no background - for browser tabs)
  const faviconSizes = [
    { size: 16, output: 'favicon-16x16.png', dir: publicDir },
    { size: 32, output: 'favicon-32x32.png', dir: publicDir },
    { size: 180, output: 'apple-touch-icon.png', dir: publicDir },
  ];

  for (const { size: s, output, dir } of faviconSizes) {
    // Resize first
    const resized = await sharp(extracted)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Get raw pixel data
    const { data, info } = await sharp(resized)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create new buffer with tinted colors
    // White pixels (globe) -> primary color
    // Black pixels (background) -> transparent
    const newData = Buffer.alloc(info.width * info.height * 4);

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelIndex = (i / info.channels) * 4;

      // Calculate brightness
      const brightness = (r + g + b) / 3;

      if (brightness > 200) {
        // White/light pixels -> primary color (fully opaque)
        newData[pixelIndex] = PRIMARY_COLOR.r;
        newData[pixelIndex + 1] = PRIMARY_COLOR.g;
        newData[pixelIndex + 2] = PRIMARY_COLOR.b;
        newData[pixelIndex + 3] = 255;
      } else if (brightness > 50) {
        // Gray pixels -> primary color with reduced opacity
        const alpha = Math.floor((brightness / 255) * 255);
        newData[pixelIndex] = PRIMARY_COLOR.r;
        newData[pixelIndex + 1] = PRIMARY_COLOR.g;
        newData[pixelIndex + 2] = PRIMARY_COLOR.b;
        newData[pixelIndex + 3] = alpha;
      } else {
        // Dark/black pixels -> transparent
        newData[pixelIndex] = 0;
        newData[pixelIndex + 1] = 0;
        newData[pixelIndex + 2] = 0;
        newData[pixelIndex + 3] = 0;
      }
    }

    await sharp(newData, {
      raw: { width: info.width, height: info.height, channels: 4 }
    })
      .png()
      .toFile(join(dir, output));

    console.log(`Created ${output}`);
  }

  // Logo icon WITH the rounded box background (for header)
  // Keep the full icon with primary background
  const logoSize = 64;
  const logoResized = await sharp(inputPath)
    .resize(logoSize, logoSize, { fit: 'cover' })
    .toBuffer();

  const { data: logoData, info: logoInfo } = await sharp(logoResized)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const logoNewData = Buffer.alloc(logoInfo.width * logoInfo.height * 4);

  for (let i = 0; i < logoData.length; i += logoInfo.channels) {
    const r = logoData[i];
    const g = logoData[i + 1];
    const b = logoData[i + 2];
    const pixelIndex = (i / logoInfo.channels) * 4;

    const brightness = (r + g + b) / 3;

    if (brightness > 200) {
      // White pixels stay white (the globe)
      logoNewData[pixelIndex] = 255;
      logoNewData[pixelIndex + 1] = 255;
      logoNewData[pixelIndex + 2] = 255;
      logoNewData[pixelIndex + 3] = 255;
    } else {
      // Dark pixels -> primary color (the background)
      logoNewData[pixelIndex] = PRIMARY_COLOR.r;
      logoNewData[pixelIndex + 1] = PRIMARY_COLOR.g;
      logoNewData[pixelIndex + 2] = PRIMARY_COLOR.b;
      logoNewData[pixelIndex + 3] = 255;
    }
  }

  await sharp(logoNewData, {
    raw: { width: logoInfo.width, height: logoInfo.height, channels: 4 }
  })
    .png()
    .toFile(join(publicDir, 'logo-icon.png'));

  console.log('Created logo-icon.png (with rounded box background)');

  // PWA icons - same style as logo (primary background, white globe)
  for (const s of [192, 512]) {
    const resized = await sharp(inputPath)
      .resize(s, s, { fit: 'cover' })
      .toBuffer();

    const { data, info } = await sharp(resized)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const newData = Buffer.alloc(info.width * info.height * 4);

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelIndex = (i / info.channels) * 4;

      const brightness = (r + g + b) / 3;

      if (brightness > 200) {
        // White pixels stay white
        newData[pixelIndex] = 255;
        newData[pixelIndex + 1] = 255;
        newData[pixelIndex + 2] = 255;
        newData[pixelIndex + 3] = 255;
      } else {
        // Dark pixels -> primary color
        newData[pixelIndex] = PRIMARY_COLOR.r;
        newData[pixelIndex + 1] = PRIMARY_COLOR.g;
        newData[pixelIndex + 2] = PRIMARY_COLOR.b;
        newData[pixelIndex + 3] = 255;
      }
    }

    await sharp(newData, {
      raw: { width: info.width, height: info.height, channels: 4 }
    })
      .png()
      .toFile(join(iconsDir, `icon-${s}x${s}.png`));

    console.log(`Created icons/icon-${s}x${s}.png`);
  }

  // Copy favicon-32x32 as favicon.png (browsers use PNG)
  await sharp(join(publicDir, 'favicon-32x32.png'))
    .toFile(join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('Done! All icons use primary color:', PRIMARY_COLOR);
}

generateFavicons().catch(console.error);
