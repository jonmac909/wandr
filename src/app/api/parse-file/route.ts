import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const fileName = file.name.toLowerCase();
    let text = '';
    
    // Handle different file types
    if (fileName.endsWith('.docx')) {
      // Parse Word document using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith('.doc')) {
      return NextResponse.json({ 
        error: 'Old .doc format not supported. Please save as .docx or .txt' 
      }, { status: 400 });
    } else if (fileName.endsWith('.pdf')) {
      // PDF parsing would require pdf-parse library
      // For now, return helpful error
      return NextResponse.json({ 
        error: 'PDF parsing not yet supported. Please copy/paste the text instead.' 
      }, { status: 400 });
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
      // Plain text files (CSV is text-based)
      text = await file.text();
    } else {
      // Try to read as text
      try {
        text = await file.text();
      } catch {
        return NextResponse.json({ 
          error: 'Unsupported file format. Please use .txt, .md, or .docx' 
        }, { status: 400 });
      }
    }
    
    if (!text.trim()) {
      return NextResponse.json({ error: 'File is empty or could not be read' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      text,
      fileName: file.name,
      fileSize: file.size
    });
    
  } catch (error) {
    console.error('File parse error:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
