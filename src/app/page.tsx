'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plane, Sparkles, Calendar, ChevronRight,
  Plus, Upload, Trash2, MapPin, ArrowRight,
  Palmtree, Mountain, Building2
} from 'lucide-react';
import { tripDb, StoredTrip } from '@/lib/db/indexed-db';
import { createTripDNA } from '@/types/trip-dna';
import { loadSampleTrip } from '@/lib/sample-trip';
import { useRouter } from 'next/navigation';
import { importCSV } from '@/lib/csv/parser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, FileSpreadsheet } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    // Helper to load trips from localStorage
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

    // Load trips from IndexedDB, merge with localStorage
    tripDb.getAll().then((dbTrips) => {
      const localTrips = loadFromLocalStorage();

      // Merge: use IndexedDB as primary, add any localStorage-only trips
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

  const handleLoadSampleTrip = async () => {
    const tripId = await loadSampleTrip();
    router.push(`/trip/${tripId}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-hero">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-16">
          {/* Logo/Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-primary px-5 py-2.5 rounded-full text-sm font-medium shadow-soft border border-primary/10">
              <Sparkles className="w-4 h-4" />
              AI-Powered Trip Planning
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              Wandr
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Not just where to go, but <span className="text-primary font-medium">how to experience it</span> —
              optimized for your pace, priorities, and travel style.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/questionnaire">
              <Button size="lg" className="gap-2 h-12 px-6 text-base shadow-glow">
                <Plus className="w-5 h-5" />
                Plan New Trip
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 h-12 px-6 text-base bg-white/80 backdrop-blur-sm hover:bg-white"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="w-5 h-5" />
              Import Itinerary
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* My Trips Section */}
        {trips.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Trips</h2>
              <Link href="/questionnaire">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  New Trip <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {trips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <Card className="group hover:shadow-soft hover:border-primary/30 transition-all cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Color accent bar */}
                        <div className="w-1.5 bg-gradient-to-b from-primary to-primary/60" />

                        <div className="flex-1 p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-sm">
                                <Plane className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                                  {trip.itinerary?.meta.title || trip.tripDna.interests.destination || 'Untitled Trip'}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {trip.itinerary?.meta.totalDays || trip.tripDna.constraints.dates.totalDays || '?'} days
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {trip.itinerary?.route.bases.length || '?'} stops
                                  </span>
                                  <Badge
                                    variant={trip.status === 'generated' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {trip.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                                onClick={(e) => deleteTrip(trip.id, e)}
                                title="Delete trip"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State / Demo Trip */}
        {!loading && trips.length === 0 && (
          <section className="mb-16">
            <Card className="overflow-hidden border-dashed border-2">
              <div className="gradient-card-coral">
                <CardContent className="py-12">
                  <div className="text-center max-w-lg mx-auto">
                    {/* Decorative icons */}
                    <div className="flex justify-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                        <Palmtree className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm -mt-2">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                        <Mountain className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-3">Start Your Adventure</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first AI-optimized trip plan, or explore our demo to see the magic in action.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/questionnaire">
                        <Button size="lg" className="gap-2 w-full sm:w-auto shadow-glow">
                          <Plus className="w-5 h-5" />
                          Plan New Trip
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="lg"
                        className="gap-2 w-full sm:w-auto bg-white/80 hover:bg-white"
                        onClick={handleLoadSampleTrip}
                      >
                        <Plane className="w-5 h-5" />
                        Load Asia Trip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>

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

      // Basic validation
      if (!parsed.meta || !parsed.days) {
        setError('Invalid itinerary format. Must have "meta" and "days" fields.');
        return;
      }

      // Generate ID if not present
      const id = parsed.id || crypto.randomUUID();
      parsed.id = id;

      // Create a basic Trip DNA from the itinerary using helper
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
      // Override ID to match parsed itinerary
      tripDna.id = id;

      // Save to localStorage
      localStorage.setItem(`trip-dna-${id}`, JSON.stringify(tripDna));
      localStorage.setItem(`itinerary-${id}`, JSON.stringify(parsed));

      // Save to IndexedDB so it appears on homepage
      await tripDb.save({
        id,
        tripDna,
        itinerary: parsed,
        createdAt: tripDna.createdAt,
        updatedAt: tripDna.updatedAt,
        syncedAt: null,
        status: 'generated',
      });

      // Navigate to trip
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

      // Create a basic Trip DNA from the itinerary using helper
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
      // Override ID to match itinerary
      tripDna.id = itinerary.id;

      // Save to localStorage
      localStorage.setItem(`trip-dna-${itinerary.id}`, JSON.stringify(tripDna));
      localStorage.setItem(`itinerary-${itinerary.id}`, JSON.stringify(itinerary));

      // Save to IndexedDB so it appears on homepage
      await tripDb.save({
        id: itinerary.id,
        tripDna,
        itinerary,
        createdAt: tripDna.createdAt,
        updatedAt: tripDna.updatedAt,
        syncedAt: null,
        status: 'generated',
      });

      // Navigate to trip
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
      // Extract trip name from filename
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
