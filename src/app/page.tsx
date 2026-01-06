'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plane, Sparkles, Calendar, ChevronRight,
  Plus, Upload, Trash2, MapPin, Map, Bell,
  Heart, Clock, AlertCircle
} from 'lucide-react';
import { tripDb, StoredTrip } from '@/lib/db/indexed-db';
import { createTripDNA } from '@/types/trip-dna';
import { useRouter } from 'next/navigation';
import { importCSV } from '@/lib/csv/parser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, FileSpreadsheet } from 'lucide-react';

// Dream trip type for bucket list
interface DreamTrip {
  id: string;
  destination: string;
  emoji: string;
  note: string;
}

// Sample dream trips (would be stored in DB in production)
const sampleDreamTrips: DreamTrip[] = [
  { id: '1', destination: 'Patagonia', emoji: '🏔️', note: 'Before 40' },
  { id: '2', destination: 'Kyoto', emoji: '🌸', note: 'Cherry blossoms' },
  { id: '3', destination: 'Iceland', emoji: '🌌', note: 'Northern lights' },
  { id: '4', destination: 'Maldives', emoji: '🏝️', note: '30th birthday' },
];

export default function Home() {
  const router = useRouter();
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [heroView, setHeroView] = useState<'map' | 'calendar'>('map');
  const [dreamTrips] = useState<DreamTrip[]>(sampleDreamTrips);

  useEffect(() => {
    const loadFromLocalStorage = (): StoredTrip[] => {
      const localTrips: StoredTrip[] = [];
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('trip-dna-')) {
          const tripId = key.replace('trip-dna-', '');
          const tripDnaStr = localStorage.getItem(key);
          const itineraryStr = localStorage.getItem(`itinerary-${tripId}`);
          if (tripDnaStr) {
            const tripDna = JSON.parse(tripDnaStr);
            const itinerary = itineraryStr ? JSON.parse(itineraryStr) : null;
            localTrips.push({
              id: tripId,
              tripDna,
              itinerary,
              createdAt: new Date(),
              updatedAt: new Date(),
              syncedAt: null,
              status: itinerary ? 'generated' : 'draft',
            });
          }
        }
      });
      return localTrips;
    };

    tripDb.getAll().then((dbTrips) => {
      const localTrips = loadFromLocalStorage();
      const dbTripIds = new Set(dbTrips.map(t => t.id));
      const mergedTrips = [
        ...dbTrips,
        ...localTrips.filter(t => !dbTripIds.has(t.id))
      ];
      setTrips(mergedTrips);
      setLoading(false);
    }).catch(() => {
      setTrips(loadFromLocalStorage());
      setLoading(false);
    });
  }, []);

  const deleteTrip = async (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trip?')) {
      await tripDb.delete(tripId);
      localStorage.removeItem(`trip-dna-${tripId}`);
      localStorage.removeItem(`itinerary-${tripId}`);
      setTrips(trips.filter(t => t.id !== tripId));
    }
  };

  // Categorize trips
  const upcomingTrips = trips.filter(t => t.status === 'generated' && t.itinerary);
  const draftTrips = trips.filter(t => t.status === 'draft' || !t.itinerary);
  const pastTrips: StoredTrip[] = []; // Would filter by date in production

  // Calculate stats - extract country from location string (e.g., "Bangkok, Thailand" -> "Thailand")
  const totalCountries = new Set(trips.flatMap(t =>
    t.itinerary?.route?.bases?.map(b => {
      const parts = b.location.split(',');
      return parts[parts.length - 1]?.trim() || b.location;
    }) || []
  )).size;
  const totalCities = trips.reduce((acc, t) =>
    acc + (t.itinerary?.route?.bases?.length || 0), 0
  );

  // Get days until next trip
  const getDaysUntil = (trip: StoredTrip) => {
    if (!trip.itinerary?.meta?.startDate) return null;
    const start = new Date(trip.itinerary.meta.startDate);
    const now = new Date();
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Wandr
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              JY
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Hero: Map/Calendar View */}
        <section>
          <Card className="overflow-hidden">
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              {/* Map visualization */}
              {heroView === 'map' && (
                <div className="absolute inset-0 p-6">
                  {/* Simplified world map dots */}
                  <div className="relative w-full h-full">
                    {/* Past trip markers */}
                    {trips.map((trip, i) => (
                      <div
                        key={trip.id}
                        className="absolute w-3 h-3 rounded-full bg-primary/60 animate-pulse"
                        style={{
                          left: `${20 + (i * 15) % 60}%`,
                          top: `${30 + (i * 20) % 40}%`,
                        }}
                        title={trip.itinerary?.meta.title || 'Trip'}
                      />
                    ))}
                    {/* Upcoming trip star */}
                    {upcomingTrips[0] && (
                      <div
                        className="absolute"
                        style={{ left: '70%', top: '35%' }}
                      >
                        <div className="w-4 h-4 text-yellow-400">★</div>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/80 whitespace-nowrap">
                          {upcomingTrips[0].itinerary?.meta.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Calendar visualization */}
              {heroView === 'calendar' && (
                <div className="absolute inset-0 p-6 flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Calendar view coming soon</p>
                  </div>
                </div>
              )}

              {/* View toggle */}
              <div className="absolute bottom-4 left-4 flex gap-1 bg-black/30 rounded-lg p-1">
                <button
                  onClick={() => setHeroView('map')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    heroView === 'map'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Map className="w-4 h-4 inline mr-1.5" />
                  Map
                </button>
                <button
                  onClick={() => setHeroView('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    heroView === 'calendar'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1.5" />
                  Calendar
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="px-4 py-3 bg-card border-t flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span><strong className="text-foreground">{totalCountries || 0}</strong> countries</span>
                <span><strong className="text-foreground">{totalCities || 0}</strong> cities</span>
                <span><strong className="text-foreground">{trips.length}</strong> trips</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Action Buttons */}
        <section className="grid grid-cols-2 gap-3">
          <Link href="/plan-mode" className="block">
            <Button className="w-full h-14 gap-2 text-base shadow-glow">
              <Sparkles className="w-5 h-5" />
              Plan My Trip
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-14 gap-2 text-base"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="w-5 h-5" />
            Upload Trip
          </Button>
        </section>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                Upcoming
              </h2>
            </div>
            <div className="space-y-3">
              {upcomingTrips.map((trip) => {
                const daysUntil = getDaysUntil(trip);
                return (
                  <Link key={trip.id} href={`/trip/${trip.id}`}>
                    <Card className="group hover:border-primary/30 transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                              <Plane className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold group-hover:text-primary transition-colors">
                                {trip.itinerary?.meta.title || 'Untitled'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {trip.itinerary?.meta.startDate} • {trip.itinerary?.meta.totalDays} days
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {daysUntil && (
                              <Badge variant="secondary" className="mb-1">
                                In {daysUntil} days
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {/* Would show task progress */}
                            </div>
                          </div>
                        </div>
                        {/* Alert for urgent tasks */}
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Book tickets before they sell out</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Draft Trips */}
        {draftTrips.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Drafts</h2>
            </div>
            <div className="space-y-2">
              {draftTrips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <Card className="group hover:border-primary/30 transition-all cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">
                              {trip.tripDna.interests.destination || 'Untitled Trip'}
                            </h3>
                            <Badge variant="outline" className="text-xs">Draft</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteTrip(trip.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Dream Trips / Bucket List */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Dream Trips
            </h2>
            <Button variant="ghost" size="sm" className="text-primary">
              + Add
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {dreamTrips.map((dream) => (
              <Card
                key={dream.id}
                className="flex-shrink-0 w-32 hover:border-primary/30 transition-all cursor-pointer"
              >
                <CardContent className="p-3 text-center">
                  <div className="text-3xl mb-2">{dream.emoji}</div>
                  <h3 className="font-medium text-sm">{dream.destination}</h3>
                  <p className="text-xs text-muted-foreground italic">"{dream.note}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Past Adventures */}
        {(pastTrips.length > 0 || trips.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                📸 Past Adventures
              </h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                See All
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {trips.filter(t => t.itinerary).slice(0, 4).map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <Card className="flex-shrink-0 w-28 hover:border-primary/30 transition-all cursor-pointer overflow-hidden">
                    <div className="h-16 gradient-primary" />
                    <CardContent className="p-2 text-center">
                      <h3 className="font-medium text-sm truncate">
                        {trip.itinerary?.meta.title?.split(' ')[0] || 'Trip'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {trip.itinerary?.meta.totalDays} days
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && trips.length === 0 && (
          <section>
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-2">Start Your Adventure</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Plan your perfect trip with AI assistance, or import an existing itinerary.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/plan-mode">
                    <Button className="gap-2 shadow-glow">
                      <Sparkles className="w-5 h-5" />
                      Plan My Trip
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}


function ImportModal({ onClose }: { onClose: () => void }) {
  const [itineraryJson, setItineraryJson] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [tripName, setTripName] = useState('');
  const [error, setError] = useState('');
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const router = useRouter();

  const handleJsonImport = async () => {
    try {
      const parsed = JSON.parse(itineraryJson);

      if (!parsed.meta || !parsed.days) {
        setError('Invalid itinerary format. Must have "meta" and "days" fields.');
        return;
      }

      const id = parsed.id || crypto.randomUUID();
      parsed.id = id;

      const tripDna = createTripDNA({
        interests: {
          destination: parsed.meta.destination || '',
          depthPreference: 'depth-fewer',
          food: { importance: 'local-spots' },
          hobbies: [],
        },
        constraints: {
          dates: { type: 'fixed', startDate: parsed.meta.startDate, endDate: parsed.meta.endDate, totalDays: parsed.meta.totalDays },
          budget: { currency: 'USD', accommodationRange: { min: 0, max: 0, perNight: true }, dailySpend: { min: 0, max: 0 }, splurgeMoments: 0 },
          accommodation: { style: 'boutique', priority: 'location' },
        },
      });
      tripDna.id = id;

      localStorage.setItem(`trip-dna-${id}`, JSON.stringify(tripDna));
      localStorage.setItem(`itinerary-${id}`, JSON.stringify(parsed));

      await tripDb.save({
        id,
        tripDna,
        itinerary: parsed,
        createdAt: tripDna.createdAt,
        updatedAt: tripDna.updatedAt,
        syncedAt: null,
        status: 'generated',
      });

      router.push(`/trip/${id}`);
    } catch {
      setError('Invalid JSON. Please check your itinerary format.');
    }
  };

  const handleCsvImport = async () => {
    try {
      if (!csvContent.trim()) {
        setError('Please paste your CSV content.');
        return;
      }

      const itinerary = importCSV(csvContent, tripName || undefined);

      if (itinerary.days.length === 0) {
        setError('No valid trip data found in CSV. Make sure it has Date, City, and Activity columns.');
        return;
      }

      const tripDna = createTripDNA({
        interests: {
          destination: itinerary.meta.destination || '',
          depthPreference: 'depth-fewer',
          food: { importance: 'local-spots' },
          hobbies: [],
        },
        constraints: {
          dates: { type: 'fixed', startDate: itinerary.meta.startDate, endDate: itinerary.meta.endDate, totalDays: itinerary.meta.totalDays },
          budget: { currency: 'USD', accommodationRange: { min: 0, max: 0, perNight: true }, dailySpend: { min: 0, max: 0 }, splurgeMoments: 0 },
          accommodation: { style: 'boutique', priority: 'location' },
        },
      });
      tripDna.id = itinerary.id;

      localStorage.setItem(`trip-dna-${itinerary.id}`, JSON.stringify(tripDna));
      localStorage.setItem(`itinerary-${itinerary.id}`, JSON.stringify(itinerary));

      await tripDb.save({
        id: itinerary.id,
        tripDna,
        itinerary,
        createdAt: tripDna.createdAt,
        updatedAt: tripDna.updatedAt,
        syncedAt: null,
        status: 'generated',
      });

      router.push(`/trip/${itinerary.id}`);
    } catch (err) {
      setError(`Error parsing CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      if (!tripName) {
        const nameFromFile = file.name.replace(/\.csv$/i, '').replace(/_/g, ' ');
        setTripName(nameFromFile);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Import Itinerary</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>

          <Tabs value={importType} onValueChange={(v) => { setImportType(v as 'csv' | 'json'); setError(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="csv" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV (Notion Export)
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <FileText className="w-4 h-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Import from a Notion database export. Your CSV should have columns like <code className="bg-muted px-1 rounded">Date</code>, <code className="bg-muted px-1 rounded">Day</code>, <code className="bg-muted px-1 rounded">City</code>, <code className="bg-muted px-1 rounded">Activity</code>, <code className="bg-muted px-1 rounded">Cost</code>, etc.
              </p>

              <div className="space-y-2">
                <Label htmlFor="tripName">Trip Name (optional)</Label>
                <Input
                  id="tripName"
                  placeholder="Europe 2025"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="csvFile">Upload CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or paste CSV</span>
                </div>
              </div>

              <textarea
                className="w-full h-48 p-4 border rounded-lg font-mono text-xs bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Date,Day,City,Activity,Transport,Accommodation Address,Cost,Reservation,Time of Day,Notes,Files & media
11/08/2025,,Toronto,Fly to Toronto @ 11:25pm,,,295.15,Not started,,,"
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setError('');
                }}
              />

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleCsvImport} disabled={!csvContent.trim()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Paste your itinerary JSON below. It should have <code className="bg-muted px-1 rounded">meta</code>, <code className="bg-muted px-1 rounded">days</code>, and optionally <code className="bg-muted px-1 rounded">route</code>, <code className="bg-muted px-1 rounded">foodLayer</code>, <code className="bg-muted px-1 rounded">packingLayer</code>.
              </p>

              <textarea
                className="w-full h-64 p-4 border rounded-lg font-mono text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder='{"meta": {"title": "My Trip", "totalDays": 7, ...}, "days": [...], ...}'
                value={itineraryJson}
                onChange={(e) => {
                  setItineraryJson(e.target.value);
                  setError('');
                }}
              />

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleJsonImport} disabled={!itineraryJson.trim()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import JSON
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
