'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'wandr-bucket-list';

interface BucketListItem {
  id: string;
  destination: string;
  country: string;
  emoji?: string;
}

interface BucketListProps {
  initialItems?: BucketListItem[];
  maxItems?: number;
}

// Country to flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'japan': '🇯🇵', 'greece': '🇬🇷', 'peru': '🇵🇪', 'iceland': '🇮🇸',
  'thailand': '🇹🇭', 'italy': '🇮🇹', 'france': '🇫🇷', 'spain': '🇪🇸',
  'portugal': '🇵🇹', 'germany': '🇩🇪', 'uk': '🇬🇧', 'usa': '🇺🇸',
  'canada': '🇨🇦', 'mexico': '🇲🇽', 'brazil': '🇧🇷', 'argentina': '🇦🇷',
  'australia': '🇦🇺', 'new zealand': '🇳🇿', 'vietnam': '🇻🇳', 'indonesia': '🇮🇩',
  'singapore': '🇸🇬', 'malaysia': '🇲🇾', 'philippines': '🇵🇭', 'south korea': '🇰🇷',
  'china': '🇨🇳', 'india': '🇮🇳', 'egypt': '🇪🇬', 'morocco': '🇲🇦',
  'south africa': '🇿🇦', 'kenya': '🇰🇪', 'norway': '🇳🇴', 'sweden': '🇸🇪',
  'netherlands': '🇳🇱', 'switzerland': '🇨🇭', 'austria': '🇦🇹', 'croatia': '🇭🇷',
  'turkey': '🇹🇷', 'uae': '🇦🇪', 'dubai': '🇦🇪', 'maldives': '🇲🇻',
};

// Default bucket list items if none provided
const DEFAULT_ITEMS: BucketListItem[] = [
  { id: '1', destination: 'Kyoto', country: 'Japan', emoji: '🇯🇵' },
  { id: '2', destination: 'Santorini', country: 'Greece', emoji: '🇬🇷' },
  { id: '3', destination: 'Machu Picchu', country: 'Peru', emoji: '🇵🇪' },
  { id: '4', destination: 'Iceland', country: 'Iceland', emoji: '🇮🇸' },
];

export function BucketList({ initialItems = DEFAULT_ITEMS, maxItems = 4 }: BucketListProps) {
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newDestination, setNewDestination] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const displayItems = items.slice(0, maxItems);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems(initialItems);
      }
    } else {
      setItems(initialItems);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    if (!newDestination.trim() || !newCountry.trim()) return;

    const emoji = COUNTRY_FLAGS[newCountry.toLowerCase()] || '🌍';
    const newItem: BucketListItem = {
      id: Date.now().toString(),
      destination: newDestination.trim(),
      country: newCountry.trim(),
      emoji,
    };

    setItems(prev => [newItem, ...prev]);
    setNewDestination('');
    setNewCountry('');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setNewDestination('');
    setNewCountry('');
    setIsAdding(false);
  };

  return (
    <Card className="h-full py-0">
      <CardContent className="p-2 h-full flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-semibold">Bucket List</h3>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>

        {/* Add form */}
        {isAdding && (
          <div className="mb-3 p-2 rounded-lg bg-muted/50 space-y-2">
            <Input
              placeholder="Destination (e.g. Bali)"
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              className="h-7 text-xs"
              autoFocus
            />
            <Input
              placeholder="Country (e.g. Indonesia)"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-xs flex-1" onClick={handleAdd}>
                <Check className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 flex-1 overflow-auto">
          {displayItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No destinations yet. Add your dream trips!
            </p>
          ) : (
            displayItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-base">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.destination}</p>
                  <p className="text-[10px] text-muted-foreground">{item.country}</p>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                  title="Remove from bucket list"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
