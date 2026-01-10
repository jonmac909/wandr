import { NextRequest, NextResponse } from 'next/server';

// Color palette for different cities - creates visual variety
const CITY_COLORS: Record<string, { bg: string; text: string }> = {
  // Turkey
  'Istanbul': { bg: '#1e3a5f', text: '#ffffff' },
  'Cappadocia': { bg: '#c4a35a', text: '#1a1a1a' },
  'Antalya': { bg: '#0e7490', text: '#ffffff' },
  'Bodrum': { bg: '#0369a1', text: '#ffffff' },
  'Ephesus': { bg: '#92400e', text: '#ffffff' },
  'Pamukkale': { bg: '#e0f2fe', text: '#0c4a6e' },
  // Spain
  'Barcelona': { bg: '#dc2626', text: '#fef08a' },
  'Madrid': { bg: '#1e40af', text: '#ffffff' },
  'Seville': { bg: '#f97316', text: '#ffffff' },
  'Granada': { bg: '#be123c', text: '#ffffff' },
  // Italy
  'Rome': { bg: '#7c2d12', text: '#fef3c7' },
  'Florence': { bg: '#4d7c0f', text: '#ffffff' },
  'Venice': { bg: '#0284c7', text: '#ffffff' },
  'Amalfi Coast': { bg: '#0891b2', text: '#ffffff' },
  // Switzerland
  'Zurich': { bg: '#374151', text: '#ffffff' },
  'Lucerne': { bg: '#2563eb', text: '#ffffff' },
  'Interlaken': { bg: '#059669', text: '#ffffff' },
  'Zermatt': { bg: '#4b5563', text: '#ffffff' },
  'Geneva': { bg: '#1f2937', text: '#ffffff' },
  // Default
  '_default': { bg: '#3b82f6', text: '#ffffff' },
};

function getColorForCity(cityName: string): { bg: string; text: string } {
  return CITY_COLORS[cityName] || CITY_COLORS['_default'];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const cityName = decodeURIComponent(name);
  const colors = getColorForCity(cityName);

  // Create SVG placeholder with city name
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${adjustColor(colors.bg, -30)};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text
        x="50%"
        y="45%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="32"
        font-weight="600"
        fill="${colors.text}"
      >${escapeXml(cityName)}</text>
      <text
        x="50%"
        y="60%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="14"
        fill="${colors.text}"
        opacity="0.7"
      >Tap to explore</text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
