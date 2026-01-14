'use client';

import { useState } from 'react';
import { X, Link2, PenLine, Camera, Loader2, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { savedPlacesDb } from '@/lib/db/indexed-db';
import type { SavedPlace } from '@/types/saved-place';

interface AddPlaceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaceAdded: () => void;
}

type AddMethod = 'url' | 'manual' | 'screenshot';

export function AddPlaceSheet({ open, onOpenChange, onPlaceAdded }: AddPlaceSheetProps) {
  const [method, setMethod] = useState<AddMethod>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // URL state
  const [url, setUrl] = useState('');

  // Manual state
  const [manualName, setManualName] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualType, setManualType] = useState<SavedPlace['type']>('attraction');
  const [manualNotes, setManualNotes] = useState('');

  const resetForm = () => {
    setUrl('');
    setManualName('');
    setManualCity('');
    setManualType('attraction');
    setManualNotes('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSaveFromUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For now, create a basic saved place from the URL
      // In the future, this could call an AI API to extract place info
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');

      // Extract a name from the URL path
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const suggestedName = pathParts.length > 0
        ? decodeURIComponent(pathParts[pathParts.length - 1]).replace(/[-_]/g, ' ')
        : 'Saved from ' + domain;

      await savedPlacesDb.save({
        name: suggestedName.slice(0, 50),
        type: 'attraction',
        city: 'Unknown',
        source: 'link',
        sourceUrl: url,
        notes: `Saved from ${domain}`,
      });

      setSuccess(true);
      onPlaceAdded();

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError('Invalid URL. Please paste a valid link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualName.trim()) {
      setError('Please enter a place name');
      return;
    }
    if (!manualCity.trim()) {
      setError('Please enter a city');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await savedPlacesDb.save({
        name: manualName.trim(),
        type: manualType,
        city: manualCity.trim(),
        source: 'manual',
        notes: manualNotes.trim() || undefined,
      });

      setSuccess(true);
      onPlaceAdded();

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      setError('Failed to save place. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="relative bg-white w-full md:w-[420px] md:rounded-xl rounded-t-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Add a place</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method tabs */}
        <div className="flex border-b">
          <button
            onClick={() => { setMethod('url'); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              method === 'url' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Paste link
          </button>
          <button
            onClick={() => { setMethod('manual'); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              method === 'manual' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenLine className="w-4 h-4" />
            Manual
          </button>
          <button
            onClick={() => { setMethod('screenshot'); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              method === 'screenshot' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            Screenshot
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-medium text-green-600">Place saved!</p>
            </div>
          ) : method === 'url' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Paste a link from TikTok, Instagram, Google Maps, or any website
              </p>
              <Input
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                We&apos;ll extract the place details automatically
              </p>
            </div>
          ) : method === 'manual' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Place name *</label>
                <Input
                  placeholder="e.g., Senso-ji Temple"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">City *</label>
                <Input
                  placeholder="e.g., Tokyo"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['attraction', 'restaurant', 'cafe', 'activity', 'nightlife'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setManualType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                        manualType === type
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (optional)</label>
                <Input
                  placeholder="Why you want to visit..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload a screenshot from TikTok, Instagram, or any app
              </p>
              <label className="block">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" disabled />
              </label>
              <p className="text-xs text-gray-400 text-center">
                Coming soon - AI will extract place info from screenshots
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 mt-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-4 border-t">
            <Button
              className="w-full"
              onClick={method === 'url' ? handleSaveFromUrl : method === 'manual' ? handleSaveManual : undefined}
              disabled={isLoading || method === 'screenshot'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              {method === 'screenshot' ? 'Coming soon' : 'Save place'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
