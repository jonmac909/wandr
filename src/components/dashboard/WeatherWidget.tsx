'use client';

import { useEffect, useState } from 'react';
import { MapPin, Droplets, ThermometerSun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { fetchWeather, WeatherData } from '@/lib/dashboard/weather';
import { preferencesDb } from '@/lib/db/indexed-db';

interface WeatherWidgetProps {
  location?: string; // Optional: if not provided, uses user's home location
}

export function WeatherWidget({ location: propLocation }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [location, setLocation] = useState<string | undefined>(propLocation);

  // Load user's home location from preferences if no prop location provided
  useEffect(() => {
    if (!propLocation) {
      preferencesDb.get().then((prefs) => {
        if (prefs.location) {
          setLocation(prefs.location);
        } else {
          setLoading(false);
        }
      });
    } else {
      setLocation(propLocation);
    }
  }, [propLocation]);

  useEffect(() => {
    if (!location) {
      return;
    }

    // Extract city name (first part before comma)
    const city = location.split(',')[0].trim();

    setLoading(true);
    setError(false);

    fetchWeather(city)
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [location]);

  if (!location && !loading) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <ThermometerSun className="w-8 h-8" />
            <div>
              <p className="text-sm font-medium">Weather unavailable</p>
              <p className="text-xs">{location}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Icon and temperature */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">{weather.icon}</div>
            <div>
              <div className="text-3xl font-bold">{weather.temperature}°</div>
              <div className="text-sm text-muted-foreground">{weather.condition}</div>
            </div>
          </div>

          {/* Right side - Details */}
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-1.5 text-sm">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{weather.location}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              H: {weather.high}° L: {weather.low}°
            </div>
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <Droplets className="w-3 h-3" />
              <span>{weather.humidity}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
