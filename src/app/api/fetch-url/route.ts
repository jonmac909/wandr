import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }
    
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Wandr/1.0; +https://trippified.com)',
        'Accept': 'text/html,text/plain,application/json,*/*',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status}` }, { status: 400 });
    }
    
    const contentType = response.headers.get('content-type') || '';
    let text = '';
    
    if (contentType.includes('text/html')) {
      const html = await response.text();
      // Extract text content from HTML
      text = extractTextFromHtml(html);
    } else if (contentType.includes('text/plain') || contentType.includes('text/markdown')) {
      text = await response.text();
    } else if (contentType.includes('application/json')) {
      const json = await response.json();
      text = JSON.stringify(json, null, 2);
    } else {
      // Try to read as text
      text = await response.text();
    }
    
    if (!text.trim()) {
      return NextResponse.json({ error: 'No readable content found' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      text,
      url: parsedUrl.href,
      contentType
    });
    
  } catch (error) {
    console.error('Fetch URL error:', error);
    return NextResponse.json({ error: 'Failed to fetch URL content' }, { status: 500 });
  }
}

// Simple HTML to text extraction
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  
  // Convert common HTML elements to text formatting
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6][^>]*>/gi, '\n');
  
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return text;
}
