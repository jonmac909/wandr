#!/usr/bin/env node
/**
 * Validates all city image URLs return 200
 * Run: node scripts/validate-city-images.mjs
 * Add to CI or pre-push hook to catch broken images before deploy
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Extract all Unsplash URLs from a file
function extractUrls(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const urlRegex = /https:\/\/images\.unsplash\.com\/photo-[^?'"\s]+\?[^'"\s]+/g;
  const matches = content.match(urlRegex) || [];
  return [...new Set(matches)]; // dedupe
}

// Check if URL returns 200
async function checkUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return { url, status: response.status, ok: response.ok };
  } catch (error) {
    return { url, status: 0, ok: false, error: error.message };
  }
}

async function main() {
  console.log('Validating city image URLs...\n');

  // Files to check
  const files = [
    join(ROOT, 'src/lib/planning/city-images.ts'),
    join(ROOT, 'src/app/api/city-image/route.ts'),
  ];

  const allUrls = new Set();
  
  for (const file of files) {
    const urls = extractUrls(file);
    urls.forEach(url => allUrls.add(url));
    console.log(`Found ${urls.length} URLs in ${file.split('/').pop()}`);
  }

  console.log(`\nChecking ${allUrls.size} unique URLs...\n`);

  const results = await Promise.all([...allUrls].map(checkUrl));
  
  const broken = results.filter(r => !r.ok);
  const working = results.filter(r => r.ok);

  console.log(`✓ ${working.length} URLs OK`);
  
  if (broken.length > 0) {
    console.log(`\n✗ ${broken.length} BROKEN URLs:\n`);
    for (const { url, status, error } of broken) {
      // Extract photo ID for easier identification
      const photoId = url.match(/photo-[a-f0-9-]+/)?.[0] || 'unknown';
      console.log(`  ${status || 'ERR'}: ${photoId}`);
      console.log(`       ${url.substring(0, 80)}...`);
      if (error) console.log(`       Error: ${error}`);
    }
    console.log('\nFix broken URLs before deploying!');
    process.exit(1);
  }

  console.log('\nAll city images validated successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
