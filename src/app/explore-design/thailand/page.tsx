'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';

export default function ThailandDesignPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const cities = [
    { id: 'bangkok', name: 'Bangkok', subtitle: 'Capital', image: '/api/placeholder/city/Bangkok' },
    { id: 'chiang-mai', name: 'Chiang Mai', subtitle: 'Lanna kingdom', image: '/api/placeholder/city/Chiang Mai' },
    { id: 'phuket', name: 'Phuket', subtitle: 'Beach resort', image: '/api/placeholder/city/Phuket' },
    { id: 'ayutthaya', name: 'Ayutthaya', subtitle: 'Ancient capital', image: '/api/placeholder/city/Ayutthaya' },
    { id: 'krabi', name: 'Krabi', subtitle: 'Islands & cliffs', image: '/api/placeholder/city/Krabi' },
    { id: 'koh-samui', name: 'Koh Samui', subtitle: 'Gulf island', image: '/api/placeholder/city/Koh Samui' },
    { id: 'chiang-rai', name: 'Chiang Rai', subtitle: 'White Temple', image: '/api/placeholder/city/Chiang Rai' },
    { id: 'pai', name: 'Pai', subtitle: 'Mountain town', image: '/api/placeholder/city/Pai' },
    { id: 'koh-phangan', name: 'Koh Phangan', subtitle: 'Full Moon Party', image: '/api/placeholder/city/Koh Phangan' },
    { id: 'koh-tao', name: 'Koh Tao', subtitle: 'Diving', image: '/api/placeholder/city/Koh Tao' },
    { id: 'hua-hin', name: 'Hua Hin', subtitle: 'Royal resort', image: '/api/placeholder/city/Hua Hin' },
    { id: 'kanchanaburi', name: 'Kanchanaburi', subtitle: 'River Kwai', image: '/api/placeholder/city/Kanchanaburi' },
    { id: 'sukhothai', name: 'Sukhothai', subtitle: 'First kingdom', image: '/api/placeholder/city/Sukhothai' },
    { id: 'koh-lipe', name: 'Koh Lipe', subtitle: 'Maldives of Thailand', image: '/api/placeholder/city/Koh Lipe' },
    { id: 'koh-chang', name: 'Koh Chang', subtitle: 'Elephant island', image: '/api/placeholder/city/Koh Chang' },
    { id: 'pattaya', name: 'Pattaya', subtitle: 'Beach city', image: '/api/placeholder/city/Pattaya' },
    { id: 'khao-sok', name: 'Khao Sok', subtitle: 'Rainforest', image: '/api/placeholder/city/Khao Sok' },
    { id: 'lopburi', name: 'Lopburi', subtitle: 'Monkey temple', image: '/api/placeholder/city/Lopburi' },
    { id: 'mae-hong-son', name: 'Mae Hong Son', subtitle: 'Remote mountains', image: '/api/placeholder/city/Mae Hong Son' },
    { id: 'railay', name: 'Railay', subtitle: 'Rock climbing', image: '/api/placeholder/city/Railay' },
  ];

  const regions = [
    { name: 'Bangkok & Central', cities: ['Bangkok', 'Ayutthaya', 'Kanchanaburi'] },
    { name: 'Northern Thailand', cities: ['Chiang Mai', 'Chiang Rai', 'Pai'] },
    { name: 'Southern Islands', cities: ['Phuket', 'Krabi', 'Koh Samui', 'Koh Phangan'] },
    { name: 'Gulf Coast', cities: ['Hua Hin', 'Koh Tao', 'Koh Chang'] },
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
          <div className="aspect-[16/9] sm:aspect-[21/9] bg-gradient-to-br from-rose-200 to-amber-100">
            <img
              src="/api/placeholder/city/Thailand"
              alt="Thailand"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          </div>
          
          {/* Back button */}
          <button
            onClick={() => router.push('/explore-design')}
            className="absolute top-4 left-4 text-white/90 hover:text-white text-sm font-medium"
          >
            Explore
          </button>


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
                  {/* Map */}
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <div className="aspect-[2/1] bg-gray-100 flex items-center justify-center relative">
                      {selectedRegion ? (
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                            <MapPin className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">{selectedRegion}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {regions.find(r => r.name === selectedRegion)?.cities.join(', ')}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <MapPin className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-medium">Select a region below</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {regions.map((region) => (
                      <button
                        key={region.name}
                        onClick={() => setSelectedRegion(selectedRegion === region.name ? null : region.name)}
                        className={`p-3 rounded-xl text-left transition-colors ${
                          selectedRegion === region.name
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <p className={`font-medium text-sm ${selectedRegion === region.name ? 'text-primary' : ''}`}>
                          {region.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{region.cities.join(', ')}</p>
                      </button>
                    ))}
                  </div>
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

          {/* Explore Cities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Explore cities</h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => router.push(`/explore-design/thailand/${city.id}`)}
                  className="text-left group"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative">
                    <img
                      src={city.image}
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
          </section>
        </div>
      </main>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={[]}
        onRefresh={() => {}}
      />
      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
}
