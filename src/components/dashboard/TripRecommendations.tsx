'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, DollarSign, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tripDb } from '@/lib/db/indexed-db';

interface TripRecommendation {
  id: string;
  title: string;
  tagline: string;
  destination: string;
  duration: string;
  budget: '$' | '$$' | '$$$';
  bestFor: string[];
  imageQuery: string;
  season?: string;
}

// Curated trip recommendations - these would eventually come from Claude API
const recommendations: TripRecommendation[] = [
  {
    id: 'porto-weekend',
    title: '3 Days in Porto',
    tagline: 'Wine, tiles & riverside charm',
    destination: 'Porto, Portugal',
    duration: '3 days',
    budget: '$',
    bestFor: ['culture', 'food'],
    imageQuery: 'porto portugal ribeira',
    season: 'Year-round',
  },
  {
    id: 'bali-adventure',
    title: 'Bali on a Budget',
    tagline: 'Temples, rice terraces & beaches',
    destination: 'Bali, Indonesia',
    duration: '7 days',
    budget: '$',
    bestFor: ['nature', 'adventure'],
    imageQuery: 'bali rice terraces ubud',
    season: 'Apr-Oct',
  },
  {
    id: 'tokyo-explorer',
    title: 'Tokyo Explorer',
    tagline: 'Neon lights meet ancient temples',
    destination: 'Tokyo, Japan',
    duration: '5 days',
    budget: '$$',
    bestFor: ['culture', 'food'],
    imageQuery: 'tokyo shibuya night',
    season: 'Mar-May, Sep-Nov',
  },
  {
    id: 'amalfi-escape',
    title: 'Amalfi Coast Escape',
    tagline: 'Cliffside villages & limoncello',
    destination: 'Amalfi Coast, Italy',
    duration: '4 days',
    budget: '$$$',
    bestFor: ['beach', 'luxury'],
    imageQuery: 'positano amalfi coast',
    season: 'May-Sep',
  },
  {
    id: 'iceland-roadtrip',
    title: 'Iceland Ring Road',
    tagline: 'Waterfalls, glaciers & northern lights',
    destination: 'Iceland',
    duration: '10 days',
    budget: '$$',
    bestFor: ['nature', 'adventure'],
    imageQuery: 'iceland waterfall seljalandsfoss',
    season: 'Jun-Aug or Sep-Mar',
  },
  {
    id: 'marrakech-souk',
    title: 'Marrakech & Beyond',
    tagline: 'Souks, riads & desert sunsets',
    destination: 'Marrakech, Morocco',
    duration: '5 days',
    budget: '$',
    bestFor: ['culture', 'adventure'],
    imageQuery: 'marrakech medina morocco',
    season: 'Mar-May, Sep-Nov',
  },
];

function getUnsplashImage(query: string, width = 400, height = 300): string {
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
}

export function TripRecommendations() {
  const router = useRouter();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handlePlanTrip = async (rec: TripRecommendation) => {
    setGeneratingId(rec.id);

    try {
      // Create a new trip with pre-filled data
      const tripId = crypto.randomUUID();
      const durationDays = parseInt(rec.duration) || 5;

      const tripDna = {
        id: tripId,
        version: '1.0',
        createdAt: new Date().toISOString(),
        interests: {
          destination: rec.destination,
          types: rec.bestFor,
        },
        constraints: {
          duration: { min: durationDays, max: durationDays, unit: 'days' as const },
          budget: rec.budget,
        },
      };

      await tripDb.save({
        id: tripId,
        tripDna: tripDna as any,
        itinerary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
        status: 'draft',
      });

      // Navigate to the trip page where AI will generate itinerary
      router.push(`/trip/${tripId}`);
    } catch (error) {
      console.error('Failed to create trip:', error);
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground">Recommended Trips</h2>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <Card
            key={rec.id}
            className="overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handlePlanTrip(rec)}
          >
            <CardContent className="p-0">
              <div className="flex">
                {/* Image */}
                <div className="w-32 h-32 sm:w-40 sm:h-36 flex-shrink-0 relative overflow-hidden">
                  <img
                    src={getUnsplashImage(rec.imageQuery, 400, 300)}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {rec.season && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                        {rec.season}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {rec.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rec.bestFor.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] capitalize">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {rec.budget}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>

              {/* Loading overlay */}
              {generatingId === rec.id && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Creating trip...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
