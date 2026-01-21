'use client';

import { useState } from 'react';
import { Heart, MapPin, Search, Star, X, Clock, DollarSign, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';

export default function ChiangMaiDesignPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Must See');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(new Set(['1', '4'])); // Some pre-saved for demo
  const [selectedPlace, setSelectedPlace] = useState<typeof allPlaces[0] | null>(null);
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Must See', 'Stay', 'Restaurants', 'Cafes', 'Markets', 'Nightlife', 'Nature', 'Activities'];
  const quickFilters = ['Open now', 'Budget', 'Family', 'Hidden gem'];

  const toggleQuickFilter = (filter: string) => {
    setActiveQuickFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const toggleSavePlace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card click
    setSavedPlaces(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // All places with coordinates for map pins and detailed info
  const allPlaces = [
    // Must See
    { id: '1', name: 'Wat Phra That Doi Suthep', desc: 'Iconic hilltop temple with city views', category: 'Must See', rating: 4.8, image: '/api/placeholder/city/temple', emoji: '🏛️', x: 25, y: 20, fullDesc: 'A sacred Buddhist temple perched on Doi Suthep mountain, offering panoramic views of Chiang Mai. The temple is reached by climbing 309 steps flanked by mythical naga serpents, or by taking the funicular. Founded in 1383, it houses a relic of the Buddha and features stunning golden chedi, intricate murals, and meditation halls.', hours: '6:00 AM - 6:00 PM', price: '30 THB', tips: 'Visit at sunrise for fewer crowds and mystical atmosphere. Dress modestly - shoulders and knees covered.', tags: ['Budget', 'Family'] },
    { id: '2', name: 'Wat Chedi Luang', desc: 'Ancient brick temple in the city center', category: 'Must See', rating: 4.6, image: '/api/placeholder/city/temple', emoji: '🏛️', x: 52, y: 55, fullDesc: 'Once the tallest structure in ancient Lanna, this 14th-century temple features a massive ruined chedi that originally stood 82 meters tall before an earthquake in 1545. The grounds include the city pillar shrine and offer free monk chats where visitors can learn about Buddhism and Thai culture.', hours: '8:00 AM - 5:00 PM', price: '40 THB', tips: 'Join the free Monk Chat sessions (usually 9am-12pm, 1pm-6pm) to learn about Buddhism.', tags: ['Budget', 'Family'] },
    { id: '3', name: 'Old City & Tha Pae Gate', desc: 'Historic walled city center', category: 'Must See', rating: 4.7, image: '/api/placeholder/city/gate', emoji: '🏰', x: 50, y: 52, fullDesc: 'The ancient heart of Chiang Mai, surrounded by a moat and remnants of 13th-century walls. Tha Pae Gate is the most intact of the original five gates and serves as a gathering place for locals and tourists alike. The square hosts events, markets, and is famous for feeding pigeons.', hours: '24 hours', price: 'Free', tips: 'Walk the moat at sunset. The area inside the walls is very walkable with temples on nearly every block.', tags: ['Budget', 'Family', 'Open now'] },
    // Stay
    { id: '4', name: '137 Pillars House', desc: 'Luxury colonial boutique hotel', category: 'Stay', rating: 4.9, image: '/api/placeholder/city/hotel', emoji: '🏨', x: 60, y: 48, fullDesc: 'An exquisite boutique hotel set in a restored 19th-century teak house once home to the founder of the East Borneo Company. Features just 30 suites with four-poster beds, private terraces, and butler service. The spa, pool, and fine dining restaurant complete the experience.', hours: 'Check-in 3PM', price: '8,000-15,000 THB/night', tips: 'Book the Jack Bain suite for the most authentic colonial experience. Afternoon tea is a must.', tags: [] },
    { id: '5', name: 'Hostel by Bed', desc: 'Stylish budget hostel in old city', category: 'Stay', rating: 4.5, image: '/api/placeholder/city/hostel', emoji: '🛏️', x: 48, y: 54, fullDesc: 'A modern, design-focused hostel with pod-style beds offering privacy curtains, personal lights, and power outlets. Common areas include a rooftop bar, co-working space, and communal kitchen. Walking distance to temples and night markets.', hours: 'Check-in 2PM', price: '350-500 THB/night', tips: 'Book a bottom pod for easier access. The rooftop is great for meeting other travelers.', tags: ['Budget', 'Open now'] },
    // Restaurants
    { id: '6', name: 'Khao Soi Khun Yai', desc: 'Famous local curry noodle spot', category: 'Restaurants', rating: 4.8, image: '/api/placeholder/city/food', emoji: '🍜', x: 58, y: 45, fullDesc: 'A humble family-run restaurant serving what many consider the best khao soi in Chiang Mai. This northern Thai coconut curry noodle soup is served with tender chicken or beef, crispy noodles on top, pickled cabbage, shallots, and lime on the side.', hours: '10:00 AM - 3:00 PM', price: '50-80 THB', tips: 'Arrive before noon as they often sell out. Cash only. Try the chicken version first.', tags: ['Budget', 'Hidden gem'] },
    { id: '7', name: 'Dash! Teak House', desc: 'Upscale northern Thai cuisine', category: 'Restaurants', rating: 4.7, image: '/api/placeholder/city/restaurant', emoji: '🍽️', x: 45, y: 42, fullDesc: 'Set in a beautiful 100-year-old teak house, this restaurant serves refined Lanna cuisine with a modern twist. The tasting menu showcases regional specialties like hang lay curry and laab with herbs from their garden. Romantic atmosphere with outdoor seating.', hours: '11:30 AM - 10:00 PM', price: '400-800 THB', tips: 'Reserve a table on the terrace for dinner. The tasting menu is worth the splurge.', tags: ['Open now'] },
    // Cafes
    { id: '8', name: 'Ristr8to Lab', desc: 'Award-winning specialty coffee', category: 'Cafes', rating: 4.8, image: '/api/placeholder/city/cafe', emoji: '☕', x: 42, y: 38, fullDesc: 'Founded by Thailand\'s most decorated barista, this cafe serves some of the best coffee in Asia. The minimalist space showcases single-origin Thai beans with precise brewing methods. Famous for intricate latte art that\'s almost too beautiful to drink.', hours: '8:00 AM - 6:00 PM', price: '80-150 THB', tips: 'Try the signature Ristr8to blend. Come early on weekends - it gets packed.', tags: ['Open now', 'Hidden gem'] },
    { id: '9', name: 'Graph Cafe', desc: 'Trendy cafe in converted warehouse', category: 'Cafes', rating: 4.5, image: '/api/placeholder/city/cafe', emoji: '📸', x: 55, y: 58, fullDesc: 'An Instagram-favorite cafe housed in a converted warehouse with exposed brick, industrial fixtures, and a vintage car inside. Serves excellent coffee, matcha drinks, and brunch items. The aesthetic draws photographers and digital nomads.', hours: '9:00 AM - 7:00 PM', price: '100-200 THB', tips: 'The corner by the vintage car is the most photographed spot. Decent wifi for working.', tags: ['Open now'] },
    // Markets
    { id: '10', name: 'Sunday Walking Street', desc: 'Massive weekly craft and food market', category: 'Markets', rating: 4.7, image: '/api/placeholder/city/market', emoji: '🛍️', x: 50, y: 60, fullDesc: 'Every Sunday, Ratchadamnoen Road transforms into a vibrant walking street market stretching over a kilometer. Find handmade crafts, hill tribe textiles, silver jewelry, local artwork, and endless street food stalls. Live music and traditional performances add to the atmosphere.', hours: 'Sundays 4:00 PM - 11:00 PM', price: 'Free entry', tips: 'Start from Tha Pae Gate and work your way west. Bring cash and be ready to bargain politely.', tags: ['Budget', 'Family'] },
    { id: '11', name: 'Warorot Market', desc: 'Authentic local day market', category: 'Markets', rating: 4.4, image: '/api/placeholder/city/market', emoji: '🏪', x: 62, y: 50, fullDesc: 'The oldest and largest market in Chiang Mai, where locals shop for everything from fresh produce to northern Thai sausages, dried fruits, and traditional clothing. Less touristy than the night markets with better prices and authentic local atmosphere.', hours: '6:00 AM - 6:00 PM', price: 'Free entry', tips: 'Go to the food hall on the 2nd floor for cheap local lunch. Great for food souvenirs.', tags: ['Budget', 'Hidden gem', 'Open now'] },
    // Nightlife
    { id: '12', name: 'Zoe in Yellow', desc: 'Popular backpacker bar area', category: 'Nightlife', rating: 4.3, image: '/api/placeholder/city/bar', emoji: '🍸', x: 55, y: 40, fullDesc: 'The epicenter of Chiang Mai\'s backpacker nightlife scene, this open-air bar complex features multiple venues, cheap drinks, loud music, and a young international crowd. The party spills onto the street with bucket cocktails and dancing until late.', hours: '6:00 PM - 2:00 AM', price: '60-150 THB', tips: 'Peak time is 11pm-1am. Located near Tha Pae Gate. Can get very crowded on weekends.', tags: ['Budget'] },
    { id: '13', name: 'North Gate Jazz', desc: 'Live jazz every night', category: 'Nightlife', rating: 4.6, image: '/api/placeholder/city/jazz', emoji: '🎷', x: 48, y: 35, fullDesc: 'An outdoor jazz bar beside the old city moat, where talented local musicians jam every night. The relaxed atmosphere attracts an older, more mellow crowd than the backpacker bars. Pull up a plastic chair, order a cold beer, and enjoy world-class jazz under the stars.', hours: '7:00 PM - midnight', price: 'Free entry', tips: 'Music usually starts around 9pm. Sit close to the band for the best experience.', tags: ['Budget', 'Hidden gem'] },
    // Nature
    { id: '14', name: 'Doi Inthanon', desc: 'Thailand\'s highest peak', category: 'Nature', rating: 4.8, image: '/api/placeholder/city/mountain', emoji: '⛰️', x: 15, y: 75, fullDesc: 'At 2,565 meters, Doi Inthanon is the highest point in Thailand. The national park features misty cloud forests, stunning waterfalls including Wachirathan and Mae Ya, Karen and Hmong hill tribe villages, and the beautiful twin pagodas built to honor the King and Queen.', hours: '5:30 AM - 6:30 PM', price: '300 THB', tips: 'Bring warm layers - it can be 10°C cooler than Chiang Mai. Visit Mae Klang Luang village for coffee.', tags: ['Family'] },
    { id: '15', name: 'Huay Tung Tao Lake', desc: 'Scenic lake with floating huts', category: 'Nature', rating: 4.5, image: '/api/placeholder/city/lake', emoji: '🏞️', x: 35, y: 25, fullDesc: 'A peaceful reservoir surrounded by mountains, popular with locals for weekend picnics. Rent a thatched bamboo hut by the water, order grilled chicken and papaya salad from vendors, and spend a lazy afternoon swimming or paddle boating with mountain views.', hours: '8:00 AM - 6:00 PM', price: '50 THB', tips: 'Best on weekday afternoons for a quiet experience. Great spot for sunset views.', tags: ['Budget', 'Family', 'Hidden gem', 'Open now'] },
    // Activities
    { id: '16', name: 'Elephant Nature Park', desc: 'Ethical elephant sanctuary', category: 'Activities', rating: 4.9, image: '/api/placeholder/city/elephant', emoji: '🐘', x: 75, y: 30, fullDesc: 'A rescue and rehabilitation center for elephants that have been abused in the tourism or logging industries. Visitors can feed, bathe, and walk with elephants in a natural setting - no riding. The park also rescues dogs, cats, and water buffalo. Book well in advance.', hours: '8:00 AM - 5:30 PM', price: '2,500 THB', tips: 'Book at least 2-3 weeks ahead. Wear clothes you don\'t mind getting muddy during bathing.', tags: ['Family'] },
    { id: '17', name: 'Thai Farm Cooking School', desc: 'Learn to cook Thai cuisine', category: 'Activities', rating: 4.8, image: '/api/placeholder/city/cooking', emoji: '👨‍🍳', x: 40, y: 65, fullDesc: 'A hands-on cooking class that starts with a market tour to select fresh ingredients, then continues at an organic farm outside the city. Learn to make 5-6 dishes including curry paste from scratch, pad thai, and mango sticky rice. Take home a recipe book.', hours: 'Morning or afternoon sessions', price: '1,200 THB', tips: 'Book the morning class to include the market tour. Vegetarian options available.', tags: ['Family'] },
    { id: '18', name: 'Flight of the Gibbon', desc: 'Zipline through rainforest canopy', category: 'Activities', rating: 4.7, image: '/api/placeholder/city/zipline', emoji: '🌳', x: 80, y: 45, fullDesc: 'An exhilarating zipline adventure through ancient rainforest with 33 platforms connected by sky bridges, abseils, and Thailand\'s longest ziplines. Spot gibbons, hornbills, and other wildlife while soaring through the treetops with stunning mountain views.', hours: '7:30 AM - 4:00 PM', price: '3,999 THB', tips: 'Wear closed-toe shoes and long pants. The early morning slot has the best chance of seeing gibbons.', tags: [] },
  ];

  const filteredPlaces = allPlaces.filter(p => {
    // Category filter
    if (p.category !== activeFilter) return false;
    // Search filter
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !p.desc.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Quick filters (if any active, place must have at least one matching tag)
    if (activeQuickFilters.size > 0) {
      const hasMatchingTag = Array.from(activeQuickFilters).some(f => p.tags?.includes(f));
      if (!hasMatchingTag) return false;
    }
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-white">
      <DashboardHeader
        activeTab="explore"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Fixed Map - 50% of remaining screen */}
      <div className="h-[50%] flex-shrink-0 relative bg-[#e8e4dc]">
          {/* Fake map background with streets pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="streets" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0 50 L100 50 M50 0 L50 100" stroke="#ccc" strokeWidth="2" fill="none"/>
                  <path d="M25 0 L25 100 M75 0 L75 100 M0 25 L100 25 M0 75 L100 75" stroke="#ddd" strokeWidth="1" fill="none"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#streets)"/>
            </svg>
          </div>

          {/* Map pins */}
          {filteredPlaces.map((place) => (
            <button
              key={place.id}
              onClick={() => setSelectedPin(selectedPin === place.id ? null : place.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                selectedPin === place.id ? 'z-20 scale-125' : 'z-10 hover:scale-110'
              }`}
              style={{ left: `${place.x}%`, top: `${place.y}%` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border-2 ${
                selectedPin === place.id 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-white border-white'
              }`}>
                {place.emoji}
              </div>
            </button>
          ))}

          {/* Back button */}
          <button
            onClick={() => router.push('/explore-design/thailand')}
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-sm font-medium text-gray-700 transition-colors"
          >
            ← Thailand
          </button>

          {/* Save button */}
          <button
            onClick={() => setSaved(!saved)}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-sm font-medium transition-colors"
          >
            <Heart className={`w-4 h-4 ${saved ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
            {saved ? 'Saved' : 'Save collection'}
          </button>

          {/* Selected pin info tooltip */}
          {selectedPin && (
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white shadow-lg">
              {(() => {
                const place = allPlaces.find(p => p.id === selectedPin);
                if (!place) return null;
                return (
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{place.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{place.desc}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="text-xs text-gray-600">{place.rating}</span>
                        <span className="text-xs text-gray-400 ml-2">{place.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
      </div>

      {/* Bottom half - scrollable content */}
      <div className="h-[50%] flex-1 flex flex-col overflow-hidden">
        {/* Sticky header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-3 pb-2">
          {/* City name + search */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold">Chiang Mai</h1>
              {savedPlaces.size > 0 && (
                <p className="text-xs text-gray-500">{savedPlaces.size} places saved to Thailand collection</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showSearch ? (
                <>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      autoFocus
                      className="w-32 pl-8 pr-2 py-1.5 rounded-full border border-gray-200 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <button 
                    onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                    className="p-1.5 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <button 
                onClick={() => setShowFilterSheet(true)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
                  activeFilter === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick filter chips */}
          <div className="flex gap-2 overflow-x-auto pt-2 scrollbar-hide">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleQuickFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 transition-colors border ${
                  activeQuickFilters.has(filter)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable places list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-2">
            {filteredPlaces.map((place) => {
              const isSaved = savedPlaces.has(place.id);
              return (
                <div
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                    selectedPin === place.id
                      ? 'bg-primary/5 border-2 border-primary'
                      : 'bg-white border border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                    <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                    <span className="absolute top-0.5 left-0.5 text-xs">{place.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{place.name}</h3>
                      <button
                        onClick={(e) => toggleSavePlace(place.id, e)}
                        className="flex-shrink-0 p-1 -m-1"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isSaved ? 'text-red-500 fill-current' : 'text-gray-300 hover:text-gray-400'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{place.desc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="text-xs text-gray-600">{place.rating}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{place.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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

      {/* Place Details Modal */}
      {selectedPlace && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedPlace(null)}
        >
          <div 
            className="bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Image */}
            <div className="relative h-48 sm:h-56 flex-shrink-0">
              <img 
                src={selectedPlace.image} 
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Close button */}
              <button 
                onClick={() => setSelectedPlace(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Category badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 text-xs font-medium flex items-center gap-1">
                <span>{selectedPlace.emoji}</span>
                <span>{selectedPlace.category}</span>
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-xl font-bold">{selectedPlace.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-sm font-medium">{selectedPlace.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Description */}
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedPlace.fullDesc}
              </p>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Hours</span>
                  </div>
                  <p className="text-sm text-gray-900">{selectedPlace.hours}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium">Price</span>
                  </div>
                  <p className="text-sm text-gray-900">{selectedPlace.price}</p>
                </div>
              </div>

              {/* Tips */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-medium text-amber-700 mb-1">💡 Local tip</p>
                <p className="text-sm text-amber-900">{selectedPlace.tips}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={(e) => {
                  toggleSavePlace(selectedPlace.id, e);
                }}
                className={`flex-1 py-3 rounded-full font-medium text-sm flex items-center justify-center gap-2 ${
                  savedPlaces.has(selectedPlace.id)
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${savedPlaces.has(selectedPlace.id) ? 'fill-current' : ''}`} />
                {savedPlaces.has(selectedPlace.id) ? 'Saved' : 'Save'}
              </button>
              <button className="flex-1 py-3 rounded-full bg-gray-900 text-white font-medium text-sm flex items-center justify-center gap-2">
                Get Directions
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Sheet */}
      {showFilterSheet && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={() => setShowFilterSheet(false)}
        >
          <div 
            className="bg-white w-full rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">Filters</h2>
              <button 
                onClick={() => setShowFilterSheet(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Filter Options */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Who it's for */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Who it&apos;s for</h3>
                <div className="flex flex-wrap gap-2">
                  {['Family', 'Couples', 'Solo', 'Groups'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleQuickFilter(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        activeQuickFilters.has(tag)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibe */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Vibe</h3>
                <div className="flex flex-wrap gap-2">
                  {['Hidden gem', 'Instagram-worthy', 'Local favorite', 'Touristy'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleQuickFilter(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        activeQuickFilters.has(tag)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Price</h3>
                <div className="flex flex-wrap gap-2">
                  {['Free', 'Budget', 'Mid-range', 'Splurge'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleQuickFilter(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        activeQuickFilters.has(tag)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Practical */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Practical</h3>
                <div className="flex flex-wrap gap-2">
                  {['Open now', 'Reservation needed', 'Indoor', 'Outdoor'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleQuickFilter(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        activeQuickFilters.has(tag)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setActiveQuickFilters(new Set())}
                className="flex-1 py-3 rounded-full bg-gray-100 text-gray-700 font-medium text-sm"
              >
                Clear all
              </button>
              <button 
                onClick={() => setShowFilterSheet(false)}
                className="flex-1 py-3 rounded-full bg-gray-900 text-white font-medium text-sm"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
