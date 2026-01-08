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
  // Need to extract ONLY the globe, cutting off the rounded corners of the box
  // The globe is roughly in the center 60% of the image
  const size = Math.min(metadata.width, metadata.height);

  // More aggressive crop to remove the rounded box corners
  const extractSize = Math.floor(size * 0.55); // Smaller extract to avoid box edges
  const offsetX = Math.floor((metadata.width - extractSize) / 2);
  const offsetY = Math.floor((metadata.height - extractSize) / 2);

  // Extract center portion (just the globe, no box corners)
  const extracted = await image
    .extract({
      left: offsetX,
      top: offsetY + 30, // Shift down slightly since globe is centered in the box
      width: extractSize,
      height: extractSize
    })
    .png()
    .toBuffer();

  // Generate favicon sizes with primary color tint (no background)
  const sizes = [
    { size: 16, output: 'favicon-16x16.png', dir: publicDir },
    { size: 32, output: 'favicon-32x32.png', dir: publicDir },
    { size: 180, output: 'apple-touch-icon.png', dir: publicDir },
    { size: 64, output: 'logo-icon.png', dir: publicDir },
  ];

  for (const { size: s, output, dir } of sizes) {
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

      if (brightness > 220) {
        // White/light pixels -> primary color (fully opaque)
        newData[pixelIndex] = PRIMARY_COLOR.r;
        newData[pixelIndex + 1] = PRIMARY_COLOR.g;
        newData[pixelIndex + 2] = PRIMARY_COLOR.b;
        newData[pixelIndex + 3] = 255;
      } else if (brightness > 100) {
        // Gray pixels -> primary color with proportional opacity
        const alpha = Math.floor(((brightness - 100) / 155) * 255);
        newData[pixelIndex] = PRIMARY_COLOR.r;
        newData[pixelIndex + 1] = PRIMARY_COLOR.g;
        newData[pixelIndex + 2] = PRIMARY_COLOR.b;
        newData[pixelIndex + 3] = alpha;
      } else {
        // Dark/black pixels -> fully transparent
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

  // PWA icons - keep the original style but with primary background
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

  // Copy favicon-32x32 as favicon.png
  await sharp(join(publicDir, 'favicon-32x32.png'))
    .toFile(join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('Done! All icons use primary color:', PRIMARY_COLOR);
}

generateFavicons().catch(console.error);
