import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sampleTripDna, sampleItinerary } from '@/lib/sample-trip';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Convert itinerary dates to ISO strings for JSON storage
    const itineraryForStorage = {
      ...sampleItinerary,
      createdAt: sampleItinerary.createdAt.toISOString(),
      updatedAt: sampleItinerary.updatedAt.toISOString(),
      aiMeta: {
        ...sampleItinerary.aiMeta,
        generatedAt: sampleItinerary.aiMeta.generatedAt.toISOString(),
      },
    };

    const { error } = await supabase
      .from('trips')
      .upsert({
        id: sampleItinerary.id,
        trip_dna: sampleTripDna,
        itinerary: itineraryForStorage,
        status: 'generated',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Seed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'ASIA 2026 trip seeded to Supabase',
      tripId: sampleItinerary.id,
    });
  } catch (error) {
    console.error('Seed failed:', error);
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}

export async function GET() {
  // Allow GET to trigger seed for convenience
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const itineraryForStorage = {
      ...sampleItinerary,
      createdAt: sampleItinerary.createdAt.toISOString(),
      updatedAt: sampleItinerary.updatedAt.toISOString(),
      aiMeta: {
        ...sampleItinerary.aiMeta,
        generatedAt: sampleItinerary.aiMeta.generatedAt.toISOString(),
      },
    };

    const { error } = await supabase
      .from('trips')
      .upsert({
        id: sampleItinerary.id,
        trip_dna: sampleTripDna,
        itinerary: itineraryForStorage,
        status: 'generated',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Seed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'ASIA 2026 trip seeded to Supabase with updated baseIds',
      tripId: sampleItinerary.id,
    });
  } catch (error) {
    console.error('Seed failed:', error);
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
