import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const inputPath = join(projectRoot, 'WhatsApp Image 2026-01-08 at 13.31.17.jpeg');
const publicDir = join(projectRoot, 'public');
const iconsDir = join(publicDir, 'icons');

// Primary color for the logo text version
const PRIMARY_COLOR = { r: 232, g: 93, b: 76 };

async function generateFavicons() {
  console.log('Processing image...');

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`Input: ${metadata.width}x${metadata.height}`);

  // This image has light gray/white outer background with black rounded square containing white airplane
  // We need to extract just the black rounded square part

  // First, find the bounds of the black square by looking at the image
  // The black square is roughly centered, let's crop to it
  const size = Math.min(metadata.width, metadata.height);

  // The black rounded rect takes up about 65% of the image
  const cropSize = Math.floor(size * 0.68);
  const offsetX = Math.floor((metadata.width - cropSize) / 2);
  const offsetY = Math.floor((metadata.height - cropSize) / 2);

  // Extract the black rounded square
  const cropped = await image
    .extract({
      left: offsetX,
      top: offsetY + 20,  // Slight adjustment since icon isn't perfectly centered
      width: cropSize,
      height: cropSize
    })
    .toBuffer();

  // Generate favicon sizes - keep the black/white as-is
  const sizes = [
    { size: 16, output: 'favicon-16x16.png', dir: publicDir },
    { size: 32, output: 'favicon-32x32.png', dir: publicDir },
    { size: 180, output: 'apple-touch-icon.png', dir: publicDir },
  ];

  for (const { size: s, output, dir } of sizes) {
    await sharp(cropped)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(dir, output));

    console.log(`Created ${output}`);
  }

  // Logo icon for header - use primary color version
  // Extract just the airplane and color it with primary
  const logoInput = join(projectRoot, 'WhatsApp Image 2026-01-08 at 13.40.51.jpeg');
  const logoSize = 64;

  const logoResized = await sharp(logoInput)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
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

    if (brightness < 80) {
      // Dark pixels -> primary color
      logoNewData[pixelIndex] = PRIMARY_COLOR.r;
      logoNewData[pixelIndex + 1] = PRIMARY_COLOR.g;
      logoNewData[pixelIndex + 2] = PRIMARY_COLOR.b;
      logoNewData[pixelIndex + 3] = 255;
    } else if (brightness < 180) {
      // Anti-aliasing
      const alpha = Math.floor(((180 - brightness) / 100) * 255);
      logoNewData[pixelIndex] = PRIMARY_COLOR.r;
      logoNewData[pixelIndex + 1] = PRIMARY_COLOR.g;
      logoNewData[pixelIndex + 2] = PRIMARY_COLOR.b;
      logoNewData[pixelIndex + 3] = alpha;
    } else {
      // Transparent
      logoNewData[pixelIndex] = 0;
      logoNewData[pixelIndex + 1] = 0;
      logoNewData[pixelIndex + 2] = 0;
      logoNewData[pixelIndex + 3] = 0;
    }
  }

  await sharp(logoNewData, {
    raw: { width: logoInfo.width, height: logoInfo.height, channels: 4 }
  })
    .png()
    .toFile(join(publicDir, 'logo-icon.png'));

  console.log('Created logo-icon.png (primary color)');

  // PWA icons - use the black rounded square version
  for (const s of [192, 512]) {
    await sharp(cropped)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(iconsDir, `icon-${s}x${s}.png`));

    console.log(`Created icons/icon-${s}x${s}.png`);
  }

  // Copy favicon-32x32 as favicon.png
  await sharp(join(publicDir, 'favicon-32x32.png'))
    .toFile(join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('Done!');
}

generateFavicons().catch(console.error);
