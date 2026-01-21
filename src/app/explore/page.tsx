'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { Input } from '@/components/ui/input';
import { tripDb, type StoredTrip } from '@/lib/db/indexed-db';
import { getCountryHero } from '@/lib/explore/country-heroes';

export default function ExploreDesignPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [destinationImages, setDestinationImages] = useState<Record<string, string>>({});
  
  const loadTrips = async () => {
    const allTrips = await tripDb.getAll();
    setTrips(allTrips);
  };
  
  useEffect(() => {
    loadTrips();
  }, []);
  
  // Fetch images for all destinations using curated hero config
  useEffect(() => {
    const destinations = ['thailand', 'japan', 'vietnam', 'indonesia', 'maldives', 'greece', 'mexico', 'italy', 'egypt', 'peru'];
    destinations.forEach(async (slug) => {
      const heroConfig = getCountryHero(slug);
      if (heroConfig) {
        try {
          const res = await fetch(`/api/site-image?site=${encodeURIComponent(heroConfig.searchQuery)}&city=${encodeURIComponent(heroConfig.city)}&country=${slug}`);
          const data = await res.json();
          if (data.imageUrl) {
            setDestinationImages(prev => ({ ...prev, [slug]: data.imageUrl }));
          }
        } catch {}
      }
    });
  }, []);
  
  // Dropdown states
  const [beachFilter, setBeachFilter] = useState('All');
  const [historyFilter, setHistoryFilter] = useState('All');
  const [foodFilter, setFoodFilter] = useState('All');
  const [beachDropdownOpen, setBeachDropdownOpen] = useState(false);
  const [historyDropdownOpen, setHistoryDropdownOpen] = useState(false);
  const [foodDropdownOpen, setFoodDropdownOpen] = useState(false);

  // Upcoming trips - featured destinations
  const upcomingTrips = [
    { name: 'Thailand', slug: 'thailand' },
    { name: 'Japan', slug: 'japan' },
    { name: 'Indonesia', slug: 'indonesia' },
    { name: 'Vietnam', slug: 'vietnam' },
  ];

  // Beach vacation destinations
  const beachDestinations = [
    { name: 'Thailand', subtitle: 'Phuket, Krabi, Koh Samui', region: 'Asia', slug: 'thailand' },
    { name: 'Indonesia', subtitle: 'Bali, Lombok, Gili Islands', region: 'Asia', slug: 'indonesia' },
    { name: 'Maldives', subtitle: 'Overwater villas, crystal waters', region: 'Asia', slug: 'maldives' },
    { name: 'Greece', subtitle: 'Santorini, Mykonos, Crete', region: 'Europe', slug: 'greece' },
    { name: 'Mexico', subtitle: 'Cancun, Tulum, Playa del Carmen', region: 'Americas', slug: 'mexico' },
  ];

  // History & culture destinations
  const historyDestinations = [
    { name: 'Italy', subtitle: 'Rome, Florence, Venice', region: 'Europe', slug: 'italy' },
    { name: 'Greece', subtitle: 'Athens, Delphi, Olympia', region: 'Europe', slug: 'greece' },
    { name: 'Egypt', subtitle: 'Pyramids, Luxor, Valley of Kings', region: 'Africa', slug: 'egypt' },
    { name: 'Peru', subtitle: 'Machu Picchu, Cusco, Lima', region: 'Americas', slug: 'peru' },
    { name: 'Japan', subtitle: 'Kyoto, Nara, Hiroshima', region: 'Asia', slug: 'japan' },
  ];

  // Food destinations
  const foodDestinations = [
    { name: 'Japan', subtitle: 'Sushi, Ramen, Kaiseki', region: 'Asia', slug: 'japan' },
    { name: 'Thailand', subtitle: 'Street food, Pad Thai, Tom Yum', region: 'Asia', slug: 'thailand' },
    { name: 'Italy', subtitle: 'Pasta, Pizza, Gelato', region: 'Europe', slug: 'italy' },
    { name: 'Vietnam', subtitle: 'Pho, Banh Mi, Fresh rolls', region: 'Asia', slug: 'vietnam' },
    { name: 'Mexico', subtitle: 'Tacos, Mole, Street corn', region: 'Americas', slug: 'mexico' },
  ];

  const regionOptions = ['All', 'Asia', 'Europe', 'Americas', 'Africa'];

  // Ready-made itineraries
  const [itineraryFilter, setItineraryFilter] = useState('Week vacation');
  const [itineraryDropdownOpen, setItineraryDropdownOpen] = useState(false);
  const itineraryOptions = ['Week vacation', 'Weekend getaways', 'Road trips'];

  const itineraries = {
    'Week vacation': [
      { name: '2 Weeks in Thailand', subtitle: 'Bangkok → Chiang Mai → Islands', flag: '🇹🇭', days: '14 days' },
      { name: 'Japan Discovery', subtitle: 'Tokyo → Kyoto → Osaka', flag: '🇯🇵', days: '10 days' },
      { name: 'Italy Classic', subtitle: 'Rome → Florence → Venice', flag: '🇮🇹', days: '12 days' },
      { name: 'Vietnam Explorer', subtitle: 'Hanoi → Hoi An → Ho Chi Minh', flag: '🇻🇳', days: '14 days' },
    ],
    'Weekend getaways': [
      { name: 'Paris Weekend', subtitle: 'Art, food & romance', flag: '🇫🇷', days: '3 days' },
      { name: 'Barcelona Escape', subtitle: 'Beach, tapas & Gaudi', flag: '🇪🇸', days: '3 days' },
      { name: 'Amsterdam Quick', subtitle: 'Canals, bikes & museums', flag: '🇳🇱', days: '2 days' },
      { name: 'Bali Retreat', subtitle: 'Temples & beaches', flag: '🇮🇩', days: '4 days' },
    ],
    'Road trips': [
      { name: 'California Coast', subtitle: 'LA → San Francisco', flag: '🇺🇸', days: '7 days' },
      { name: 'New Zealand South', subtitle: 'Queenstown → Milford', flag: '🇳🇿', days: '10 days' },
      { name: 'Scottish Highlands', subtitle: 'Edinburgh → Isle of Skye', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', days: '5 days' },
      { name: 'Iceland Ring Road', subtitle: 'Full circle adventure', flag: '🇮🇸', days: '8 days' },
    ],
  };

  const filterByRegion = (destinations: typeof beachDestinations, filter: string) => {
    if (filter === 'All') return destinations;
    return destinations.filter(d => d.region === filter);
  };

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        activeTab="explore"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search places to explore..."
            className="pl-10 h-12 rounded-xl bg-gray-50 border-0"
            readOnly
          />
        </div>

        {/* Upcoming Trips */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Explore upcoming</h2>
          <div className="grid grid-cols-4 gap-2">
            {upcomingTrips.map((trip) => (
              <button
                key={trip.name}
                onClick={() => router.push(`/explore/${trip.slug}`)}
                className="relative rounded-xl overflow-hidden shadow-sm text-left"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-teal-400 to-emerald-600">
                  {destinationImages[trip.slug] && (
                    <img src={destinationImages[trip.slug]} alt={trip.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                  <h3 className="font-semibold text-xs">{trip.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Best Beach Vacations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">🏖️ Best beach vacations</h2>
            <div className="relative">
              <button 
                onClick={() => { setBeachDropdownOpen(!beachDropdownOpen); setHistoryDropdownOpen(false); setFoodDropdownOpen(false); }}
                className="flex items-center gap-1 text-sm text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                {beachFilter} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {beachDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[100px]">
                  {regionOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => { setBeachFilter(option); setBeachDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${beachFilter === option ? 'text-primary font-medium' : 'text-gray-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {filterByRegion(beachDestinations, beachFilter).slice(0, 4).map((dest) => (
              <button
                key={dest.name}
                onClick={() => router.push(`/explore/${dest.slug}`)}
                className="relative rounded-xl overflow-hidden shadow-sm text-left"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-cyan-400 to-blue-500">
                  {destinationImages[dest.slug] && (
                    <img src={destinationImages[dest.slug]} alt={dest.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                  <h3 className="font-semibold text-xs">{dest.name}</h3>
                  <p className="text-[10px] text-white/80 line-clamp-1">{dest.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Best History & Culture */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">🏛️ Best history & culture</h2>
            <div className="relative">
              <button 
                onClick={() => { setHistoryDropdownOpen(!historyDropdownOpen); setBeachDropdownOpen(false); setFoodDropdownOpen(false); }}
                className="flex items-center gap-1 text-sm text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                {historyFilter} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {historyDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[100px]">
                  {regionOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => { setHistoryFilter(option); setHistoryDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${historyFilter === option ? 'text-primary font-medium' : 'text-gray-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {filterByRegion(historyDestinations, historyFilter).slice(0, 4).map((dest) => (
              <button
                key={dest.name}
                onClick={() => router.push(`/explore/${dest.slug}`)}
                className="relative rounded-xl overflow-hidden shadow-sm text-left"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-amber-400 to-orange-500">
                  {destinationImages[dest.slug] && (
                    <img src={destinationImages[dest.slug]} alt={dest.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                  <h3 className="font-semibold text-xs">{dest.name}</h3>
                  <p className="text-[10px] text-white/80 line-clamp-1">{dest.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Best Food Destinations */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">🍜 Best food destinations</h2>
            <div className="relative">
              <button 
                onClick={() => { setFoodDropdownOpen(!foodDropdownOpen); setBeachDropdownOpen(false); setHistoryDropdownOpen(false); }}
                className="flex items-center gap-1 text-sm text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                {foodFilter} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {foodDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[100px]">
                  {regionOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => { setFoodFilter(option); setFoodDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${foodFilter === option ? 'text-primary font-medium' : 'text-gray-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {filterByRegion(foodDestinations, foodFilter).slice(0, 4).map((dest) => (
              <button
                key={dest.name}
                onClick={() => router.push(`/explore/${dest.slug}`)}
                className="relative rounded-xl overflow-hidden shadow-sm text-left"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-red-400 to-pink-500">
                  {destinationImages[dest.slug] && (
                    <img src={destinationImages[dest.slug]} alt={dest.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                  <h3 className="font-semibold text-xs">{dest.name}</h3>
                  <p className="text-[10px] text-white/80 line-clamp-1">{dest.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Ready-made Itineraries */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">📋 Ready-made itineraries</h2>
            <div className="relative">
              <button 
                onClick={() => { setItineraryDropdownOpen(!itineraryDropdownOpen); setBeachDropdownOpen(false); setHistoryDropdownOpen(false); setFoodDropdownOpen(false); }}
                className="flex items-center gap-1 text-sm text-gray-600 px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                {itineraryFilter} <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {itineraryDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 min-w-[140px]">
                  {itineraryOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => { setItineraryFilter(option); setItineraryDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${itineraryFilter === option ? 'text-primary font-medium' : 'text-gray-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {itineraries[itineraryFilter as keyof typeof itineraries].map((itin) => (
              <button
                key={itin.name}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">{itin.flag}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{itin.name}</h3>
                  <p className="text-[11px] text-gray-500 truncate">{itin.subtitle}</p>
                </div>
                <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full">{itin.days}</span>
              </button>
            ))}
          </div>
        </section>

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
