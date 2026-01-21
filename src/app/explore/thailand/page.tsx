'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronRight, ChevronDown, MapPin, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { tripDb, type StoredTrip } from '@/lib/db/indexed-db';
import { getCountryHero } from '@/lib/explore/country-heroes';

// Dynamic import for Leaflet map (no SSR)
const ThailandMap = dynamic(() => import('@/components/explore/ThailandMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-blue-50 flex items-center justify-center rounded-xl">
      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
    </div>
  ),
});

export default function ThailandDesignPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [cityImages, setCityImages] = useState<Record<string, string>>({});
  
  const loadTrips = async () => {
    const allTrips = await tripDb.getAll();
    setTrips(allTrips);
  };
  
  useEffect(() => {
    loadTrips();
  }, []);
  
  // Fetch city images
  useEffect(() => {
    const allCities = [
      'Chiang Mai', 'Chiang Rai', 'Pai', 'Mae Hong Son', 'Sukhothai', 'Lampang',
      'Bangkok', 'Ayutthaya', 'Kanchanaburi', 'Lopburi', 'Hua Hin',
      'Pattaya', 'Koh Samet', 'Koh Chang',
      'Koh Samui', 'Koh Phangan', 'Koh Tao',
      'Phuket', 'Krabi', 'Koh Phi Phi', 'Koh Lanta', 'Railay', 'Khao Lak', 'Koh Lipe'
    ];
    
    allCities.forEach(async (city) => {
      try {
        const res = await fetch(`/api/city-image?city=${encodeURIComponent(city)}&country=Thailand`);
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            setCityImages(prev => ({ ...prev, [city]: data.imageUrl }));
          }
        }
      } catch {
        // Keep placeholder
      }
    });
  }, []);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('north');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  
  // Get curated hero config for Thailand
  const heroConfig = getCountryHero('thailand');
  
  // Fetch hero image using curated config
  useEffect(() => {
    if (!heroConfig) return;
    fetch(`/api/site-image?site=${encodeURIComponent(heroConfig.searchQuery)}&city=${encodeURIComponent(heroConfig.city)}&country=Thailand`)
      .then(res => res.json())
      .then(data => {
        if (data.imageUrl) setHeroImage(data.imageUrl);
      })
      .catch(() => {});
  }, [heroConfig]);

  const regionData = [
    { 
      id: 'north',
      name: 'Northern', 
      description: 'Mountains, temples & Lanna culture',
      flightFromBkk: '1 hr flight',
      cities: [
        { id: 'chiang-mai', name: 'Chiang Mai', subtitle: 'Lanna capital' },
        { id: 'chiang-rai', name: 'Chiang Rai', subtitle: 'White Temple' },
        { id: 'pai', name: 'Pai', subtitle: 'Hippie mountain town' },
        { id: 'mae-hong-son', name: 'Mae Hong Son', subtitle: 'Remote loop' },
        { id: 'sukhothai', name: 'Sukhothai', subtitle: 'First Thai kingdom' },
        { id: 'lampang', name: 'Lampang', subtitle: 'Horse carriages' },
      ]
    },
    { 
      id: 'central',
      name: 'Central', 
      description: 'Bangkok & ancient capitals',
      flightFromBkk: null,
      cities: [
        { id: 'bangkok', name: 'Bangkok', subtitle: 'Capital city' },
        { id: 'ayutthaya', name: 'Ayutthaya', subtitle: 'UNESCO ruins' },
        { id: 'kanchanaburi', name: 'Kanchanaburi', subtitle: 'River Kwai' },
        { id: 'lopburi', name: 'Lopburi', subtitle: 'Monkey temple' },
        { id: 'hua-hin', name: 'Hua Hin', subtitle: 'Royal resort' },
      ]
    },
    { 
      id: 'east',
      name: 'Eastern', 
      description: 'Eastern seaboard & islands',
      flightFromBkk: '2-5 hr drive',
      cities: [
        { id: 'pattaya', name: 'Pattaya', subtitle: 'Beach city' },
        { id: 'koh-samet', name: 'Koh Samet', subtitle: 'Weekend island' },
        { id: 'koh-chang', name: 'Koh Chang', subtitle: 'Elephant island' },
      ]
    },
    { 
      id: 'gulf',
      name: 'Gulf Islands', 
      description: 'Party islands & diving',
      flightFromBkk: '1 hr to Samui',
      cities: [
        { id: 'koh-samui', name: 'Koh Samui', subtitle: 'Luxury resorts' },
        { id: 'koh-phangan', name: 'Koh Phangan', subtitle: 'Full Moon Party' },
        { id: 'koh-tao', name: 'Koh Tao', subtitle: 'Diving mecca' },
      ]
    },
    { 
      id: 'andaman',
      name: 'Andaman', 
      description: 'Best beaches & diving',
      flightFromBkk: '1.5 hr to Phuket',
      cities: [
        { id: 'phuket', name: 'Phuket', subtitle: 'Beach resort hub' },
        { id: 'krabi', name: 'Krabi', subtitle: 'Limestone cliffs' },
        { id: 'koh-phi-phi', name: 'Koh Phi Phi', subtitle: 'The Beach island' },
        { id: 'koh-lanta', name: 'Koh Lanta', subtitle: 'Relaxed island' },
        { id: 'railay', name: 'Railay', subtitle: 'Rock climbing' },
        { id: 'khao-lak', name: 'Khao Lak', subtitle: 'Similan diving' },
        { id: 'koh-lipe', name: 'Koh Lipe', subtitle: 'Thai Maldives' },
      ]
    },
  ];

  const timeline = [
    { year: '1238', event: 'First Thai kingdom (Sukhothai) established' },
    { year: '1351', event: 'Ayutthaya Kingdom founded, major trading power for 400 years' },
    { year: '1767', event: 'Burmese armies destroy Ayutthaya' },
    { year: '1782', event: 'King Rama I founds Bangkok and Chakri dynasty' },
    { year: '1932', event: 'Bloodless revolution establishes constitutional monarchy' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white">
      <DashboardHeader
        activeTab="explore"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="relative">
          <div className="aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-emerald-400 to-teal-600 overflow-hidden">
            {heroImage ? (
              <img
                src={heroImage}
                alt="Thailand"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
          
          {/* Back button */}
          <button
            onClick={() => router.push('/explore')}
            className="absolute top-4 left-4 text-white/90 hover:text-white text-sm font-medium"
          >
            Explore
          </button>
          
          {/* Country name overlay */}
          <div className="absolute bottom-4 left-4">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Thailand</h1>
          </div>
          
          {/* Image credit */}
          <div className="absolute bottom-4 right-4">
            <p className="text-white/70 text-xs">{heroConfig?.caption}</p>
          </div>
        </div>

        <div className="px-4 py-6 space-y-8">
          {/* Quick Glance */}
          <section className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <h2 className="font-semibold text-lg mb-3">Quick glance</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Thailand is a Southeast Asian country. It&apos;s known for tropical beaches, opulent royal 
              palaces, ancient ruins and ornate temples displaying figures of Buddha. In Bangkok, 
              the capital, an ultramodern cityscape rises next to quiet canalside communities and 
              the iconic temples of Wat Arun, Wat Pho and the Emerald Buddha Temple (Wat Phra Kaew). 
              Nearby beach resorts include bustling Pattaya and fashionable Hua Hin.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
                Vibe: temples + beaches + street food
              </span>
              <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                Best season: Nov-Feb
              </span>
              <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                Good for: 2-4 weeks
              </span>
            </div>
          </section>

          {/* Accordion Sections */}
          <section className="space-y-3">
            {/* History - First */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedCard(expandedCard === 'history' ? null : 'history')}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">History</span>
                  </div>
                  {expandedCard !== 'history' && (
                    <p className="text-sm text-gray-500 mt-1 ml-7">
                      The only Southeast Asian nation never colonized. From ancient Sukhothai to the modern Chakri dynasty.
                    </p>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedCard === 'history' ? 'rotate-180' : ''}`} />
              </button>
              {expandedCard === 'history' && (
                <div className="px-4 pb-4">
                  <div className="space-y-0">
                    {timeline.map((item, idx) => (
                      <div key={idx} className="flex items-baseline gap-4 py-3 border-b border-gray-100 last:border-0">
                        <span className="text-xs font-medium text-primary w-10 flex-shrink-0">{item.year}</span>
                        <p className="text-sm text-gray-600 flex-1">{item.event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Geography */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedCard(expandedCard === 'geography' ? null : 'geography')}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Geography</span>
                  </div>
                  {expandedCard !== 'geography' && (
                    <p className="text-sm text-gray-500 mt-1 ml-7">
                      Mountains, jungles, and 3,000km of coastline. Four distinct regions, each with its own character.
                    </p>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedCard === 'geography' ? 'rotate-180' : ''}`} />
              </button>
              {expandedCard === 'geography' && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Thailand spans 513,120 km² in Southeast Asia. Mountains in the north, Khorat Plateau in the northeast, 
                      fertile central plains, and over 3,000km of coastline with hundreds of islands.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Capital:</span> <span className="font-medium">Bangkok</span></div>
                    <div><span className="text-gray-500">Population:</span> <span className="font-medium">70 million</span></div>
                    <div><span className="text-gray-500">Currency:</span> <span className="font-medium">Thai Baht (฿)</span></div>
                    <div><span className="text-gray-500">Time Zone:</span> <span className="font-medium">UTC+7</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="font-medium text-gray-700">Northern</p>
                      <p className="text-gray-500">Mountains & temples</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="font-medium text-gray-700">Central</p>
                      <p className="text-gray-500">Bangkok & plains</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="font-medium text-gray-700">Gulf Coast</p>
                      <p className="text-gray-500">Islands & beaches</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="font-medium text-gray-700">Andaman</p>
                      <p className="text-gray-500">Cliffs & diving</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Alerts */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedCard(expandedCard === 'alerts' ? null : 'alerts')}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-gray-700">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Quick alerts</span>
                  </div>
                  {expandedCard !== 'alerts' && (
                    <p className="text-sm text-gray-500 mt-1 ml-7">
                      Best time Nov-Feb. Watch for burning season in the North. Visa-free for most.
                    </p>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedCard === 'alerts' ? 'rotate-180' : ''}`} />
              </button>
              {expandedCard === 'alerts' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                    <p className="text-xs font-medium text-green-800 mb-1">Best time to visit</p>
                    <p className="text-sm text-green-700">Nov-Feb (cool & dry, peak season)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs font-medium text-amber-800 mb-1">Seasonal risk</p>
                    <p className="text-sm text-amber-700">Burning season Feb-Apr in the North (heavy smoke)</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-medium text-blue-800 mb-1">Visa</p>
                    <p className="text-sm text-blue-700">Most nationalities get 30-60 day visa-free entry</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-1">Safety</p>
                    <p className="text-sm text-gray-600">Very safe for tourists. Watch for common scams (tuk-tuk tours, gem shops)</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Explore Cities with Region Tabs */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Explore by region</h2>
            </div>
            
            {/* Interactive Map */}
            <div className="h-96 rounded-xl overflow-hidden border border-gray-200">
              <ThailandMap
                selectedRegion={selectedRegion}
                onRegionClick={(regionId) => setSelectedRegion(regionId)}
              />
            </div>

            {/* Region Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {regionData.map((region) => {
                const colors: Record<string, string> = {
                  north: 'bg-red-500',
                  central: 'bg-blue-500',
                  east: 'bg-orange-500',
                  gulf: 'bg-emerald-500',
                  andaman: 'bg-purple-500',
                };
                const isSelected = selectedRegion === region.id;
                return (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isSelected 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${colors[region.id]}`} />
                    {region.name.replace(' Thailand', '')}
                    <span className="text-xs opacity-60">({region.cities.length})</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Region Info + Cities */}
            {regionData.filter(r => r.id === selectedRegion).map((region) => (
              <div key={region.id} className="space-y-4">
                {/* Region description */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{region.description}</p>
                  </div>
                  {region.flightFromBkk && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      ✈️ {region.flightFromBkk}
                    </span>
                  )}
                </div>

                {/* Cities Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {region.cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => router.push(`/explore/thailand/${city.id}`)}
                      className="text-left group"
                    >
                      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative">
                        <img
                          src={cityImages[city.name] || `/api/placeholder/city/${city.name}`}
                          alt={city.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-medium truncate">{city.name}</p>
                          <p className="text-white/70 text-[10px] truncate">{city.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Quick tip about Thailand's size */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-700">
                <span className="font-medium">Tip:</span> Thailand is longer than California. Bangkok → Chiang Mai is 1hr flight. Bangkok → Phuket is 1.5hrs. Pick a region or plan 2+ weeks!
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
        onRefresh={loadTrips}
      />
      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
}
