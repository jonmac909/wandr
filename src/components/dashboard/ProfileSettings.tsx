'use client';

import { useState, useEffect } from 'react';
import { MapPin, Home, Globe, Plane, Moon, Sun, DollarSign, Ruler, Save, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { preferencesDb, type UserPreferences } from '@/lib/db/indexed-db';
import { TokenSettings } from '@/components/chat/TokenSettings';

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreferencesUpdate?: (prefs: UserPreferences) => void;
}

const CURRENCIES = [
  { value: 'USD', label: '$ USD' },
  { value: 'CAD', label: '$ CAD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'JPY', label: '¥ JPY' },
  { value: 'THB', label: '฿ THB' },
  { value: 'AUD', label: '$ AUD' },
];

const TIMEZONES = [
  { value: 'America/Vancouver', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Bangkok', label: 'Indochina (ICT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function ProfileSettings({ open, onOpenChange, onPreferencesUpdate }: ProfileSettingsProps) {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      preferencesDb.get().then(setPrefs);
    }
  }, [open]);

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    await preferencesDb.update(prefs);
    onPreferencesUpdate?.(prefs);
    setSaving(false);
    onOpenChange(false);
  };

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: value });
  };

  if (!prefs) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Profile Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Home className="w-4 h-4" />
              Your Profile
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={prefs.name || ''}
                  onChange={(e) => updatePref('name', e.target.value)}
                  placeholder="Your name"
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Home Location
                </Label>
                <Input
                  id="location"
                  value={prefs.location || ''}
                  onChange={(e) => updatePref('location', e.target.value)}
                  placeholder="e.g., Kelowna, Canada"
                  className="h-9 mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Used for weather widget
                </p>
              </div>

              <div>
                <Label htmlFor="homeAirport" className="text-xs flex items-center gap-1">
                  <Plane className="w-3 h-3" />
                  Home Airport
                </Label>
                <Input
                  id="homeAirport"
                  value={prefs.homeAirport || ''}
                  onChange={(e) => updatePref('homeAirport', e.target.value.toUpperCase())}
                  placeholder="e.g., YLW"
                  className="h-9 mt-1 uppercase"
                  maxLength={4}
                />
              </div>

              <div>
                <Label htmlFor="timezone" className="text-xs flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Timezone
                </Label>
                <Select
                  value={prefs.timezone || 'America/Vancouver'}
                  onValueChange={(value) => updatePref('timezone', value)}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Claude AI Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Assistant
            </h3>
            <TokenSettings />
          </div>

          {/* Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Preferences
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="theme" className="text-xs flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  Theme
                </Label>
                <Select
                  value={prefs.theme}
                  onValueChange={(value) => updatePref('theme', value as 'light' | 'dark' | 'system')}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency" className="text-xs flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Currency
                </Label>
                <Select
                  value={prefs.defaultCurrency}
                  onValueChange={(value) => updatePref('defaultCurrency', value)}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="measurement" className="text-xs flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  Measurement
                </Label>
                <Select
                  value={prefs.measurementSystem}
                  onValueChange={(value) => updatePref('measurementSystem', value as 'metric' | 'imperial')}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (km, °C)</SelectItem>
                    <SelectItem value="imperial">Imperial (mi, °F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
