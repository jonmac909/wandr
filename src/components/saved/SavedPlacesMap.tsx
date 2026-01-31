'use client';

import { useMemo } from 'react';

interface SavedPlacesMapProps {
  cities: string[];
  expanded?: boolean;
}

export default function SavedPlacesMap({ cities, expanded = false }: SavedPlacesMapProps) {
  const uniqueCities = useMemo(() => Array.from(new Set(cities)), [cities]);

  return (
    <div 
      className={`w-full ${expanded ? 'h-[400px]' : 'h-[200px]'} bg-gradient-to-b from-green-100 to-blue-50 relative transition-all duration-300 rounded-xl overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-30">
        <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="25" cy="25" rx="12" ry="15" fill="#22c55e" opacity="0.4" />
          <ellipse cx="50" cy="22" rx="8" ry="10" fill="#22c55e" opacity="0.4" />
          <ellipse cx="75" cy="28" rx="15" ry="12" fill="#22c55e" opacity="0.4" />
        </svg>
      </div>
      
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{uniqueCities.length} cities</p>
            <p className="text-xs text-gray-500">with saved places</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-wrap gap-1 justify-center max-w-[80%]">
          {uniqueCities.slice(0, 10).map((city, i) => (
            <div 
              key={city} 
              className="w-3 h-3 bg-blue-500 rounded-full shadow-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
              title={city}
            />
          ))}
          {uniqueCities.length > 10 && (
            <div className="w-6 h-3 bg-blue-400 rounded-full text-[8px] text-white flex items-center justify-center">
              +{uniqueCities.length - 10}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
