'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tripDb } from '@/lib/db/indexed-db';
import { createTripDNA } from '@/types/trip-dna';
import { importCSV } from '@/lib/csv/parser';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [itineraryJson, setItineraryJson] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [tripName, setTripName] = useState('');
  const [error, setError] = useState('');
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const router = useRouter();

  if (!open) return null;

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
