import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Determine media type
    const mediaType = file.type || 'image/jpeg';
    const isImage = mediaType.startsWith('image/');
    const isPdf = mediaType === 'application/pdf';

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Please upload an image (JPG, PNG) or PDF file' },
        { status: 400 }
      );
    }

    // For PDFs, we'll treat them as documents (Claude can read PDFs)
    const content = isImage
      ? [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extract ALL transport information from this ticket/booking/receipt. This could be a flight, train, bus, taxi, or any other transport.

Return ONLY valid JSON with this structure:

{
  "transports": [
    {
      "type": "flight" | "train" | "bus" | "taxi" | "ferry" | "other",
      "operator": "Airline/Train company/Bus company name",
      "vehicleNumber": "Flight XX123 or Train 456 or Bus route",
      "from": "Origin city or station",
      "fromCode": "ABC (airport/station code if available)",
      "to": "Destination city or station",
      "toCode": "XYZ (airport/station code if available)",
      "departureDate": "YYYY-MM-DD",
      "departureTime": "HH:MM",
      "arrivalDate": "YYYY-MM-DD",
      "arrivalTime": "HH:MM",
      "duration": "Duration in minutes if shown",
      "confirmationNumber": "Booking reference",
      "seatNumber": "Seat if assigned",
      "class": "Economy/Business/First/Standard",
      "passenger": "Passenger name",
      "cost": "Price if shown (include currency)"
    }
  ]
}

Extract multiple segments if this is a multi-leg journey. Use null for any fields you can't find. Return ONLY the JSON, no explanation.`,
          },
        ]
      : [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extract ALL transport information from this ticket/booking/receipt. This could be a flight, train, bus, taxi, or any other transport.

Return ONLY valid JSON with this structure:

{
  "transports": [
    {
      "type": "flight" | "train" | "bus" | "taxi" | "ferry" | "other",
      "operator": "Airline/Train company/Bus company name",
      "vehicleNumber": "Flight XX123 or Train 456 or Bus route",
      "from": "Origin city or station",
      "fromCode": "ABC (airport/station code if available)",
      "to": "Destination city or station",
      "toCode": "XYZ (airport/station code if available)",
      "departureDate": "YYYY-MM-DD",
      "departureTime": "HH:MM",
      "arrivalDate": "YYYY-MM-DD",
      "arrivalTime": "HH:MM",
      "duration": "Duration in minutes if shown",
      "confirmationNumber": "Booking reference",
      "seatNumber": "Seat if assigned",
      "class": "Economy/Business/First/Standard",
      "passenger": "Passenger name",
      "cost": "Price if shown (include currency)"
    }
  ]
}

Extract multiple segments if this is a multi-leg journey. Use null for any fields you can't find. Return ONLY the JSON, no explanation.`,
          },
        ];

    // Call Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process ticket' },
        { status: 500 }
      );
    }

    const message = await response.json();

    // Extract text content
    const textContent = message.content?.find(
      (block: { type: string }) => block.type === 'text'
    );
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON response
    let jsonStr = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonStr);

    console.log('[parse-ticket] Extracted transports:', data.transports?.length || 0);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error parsing ticket:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to parse ticket: ${errorMessage}` },
      { status: 500 }
    );
  }
}
