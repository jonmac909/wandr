'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TripDNA } from '@/types/trip-dna';
import { Itinerary, DayPlan, FoodRecommendation } from '@/types/itinerary';
import { TripOverview } from '@/components/itinerary/trip-overview';
import { DayCard } from '@/components/itinerary/day-card';
import { PackingListView } from '@/components/itinerary/packing-list';
import { FoodLayerView } from '@/components/itinerary/food-layer';
import { FoodRecommendationModal } from '@/components/itinerary/food-recommendation-modal';
import { generatePackingList, isPackingListEmpty } from '@/lib/packing/generator';
import { fixFlightDurations, fixAirportCodes } from '@/lib/trips/fix-durations';
import { generateBookingUrl } from '@/lib/booking/urls';
import { getFlagForLocation } from '@/lib/geo/city-country';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Calendar, Package, Utensils, Map, Sparkles, Clock, Plane, Train,
  ChevronLeft, Home, Trash2, Pencil, Save, X, RefreshCw,
  LayoutList, CalendarDays, FileText, DollarSign, GripVertical,
  Check, Circle, Hotel, UtensilsCrossed, Compass, MapPin, MoreHorizontal, ChevronDown,
  Shield, CreditCard, Stethoscope, Car, Ticket, Upload, Plus, ExternalLink,
  Lock, Unlock, Heart
} from 'lucide-react';
import Link from 'next/link';
import { tripDb, documentDb, savedPlacesDb, StoredDocument } from '@/lib/db/indexed-db';
import type { SavedPlace } from '@/types/saved-place';
import { DashboardHeader, TripDrawer, ProfileSettings, MonthCalendar } from '@/components/dashboard';
import { TripRouteMap } from '@/components/trip/TripRouteMap';
import { TripHubSection } from '@/components/trip/TripHubSection';
import { TripHubHero } from '@/components/trip/TripHubHero';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PlanningCuration } from '@/components/planning/PlanningCuration';
import { SwipeablePlanningView } from '@/components/planning/SwipeablePlanningView';
import { SteppedCuration } from '@/components/planning/SteppedCuration';
import type { PlanningItem } from '@/components/planning/PlanningTripToggle';
import { itineraryToPlanningItems } from '@/lib/planning/itinerary-to-planning';
import { getCityImage } from '@/lib/planning/city-images';

// Trip Hub Preferences Types and Options
type Budget = '$' | '$$' | '$$$';
type Pace = 'relaxed' | 'balanced' | 'active';
type TravelerType = 'solo' | 'couple' | 'friends' | 'family';
type LodgingType = 'hotel' | 'boutique' | 'apartment' | 'resort';
type AreaType = 'quiet' | 'central';
type TripType =
  | 'beach' | 'mountains' | 'gardens' | 'countryside'
  | 'museums' | 'theater' | 'history' | 'local-traditions'
  | 'spa' | 'lounges'
  | 'hiking' | 'water-sports' | 'wildlife'
  | 'street-food' | 'fine-dining' | 'food-tours'
  | 'nightlife' | 'shopping' | 'photography';

const LODGING_OPTIONS: { id: LodgingType; label: string }[] = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'resort', label: 'Resort' },
];

const AREA_OPTIONS: { id: AreaType; label: string }[] = [
  { id: 'quiet', label: 'Quiet' },
  { id: 'central', label: 'Central' },
];

const TRIP_TYPE_CATEGORIES = [
  {
    label: 'Scenery',
    types: [
      { id: 'beach' as TripType, label: 'Beaches' },
      { id: 'mountains' as TripType, label: 'Mountains' },
      { id: 'gardens' as TripType, label: 'Gardens' },
      { id: 'countryside' as TripType, label: 'Countryside' },
    ],
  },
  {
    label: 'Culture',
    types: [
      { id: 'museums' as TripType, label: 'Museums' },
      { id: 'theater' as TripType, label: 'Theater' },
      { id: 'history' as TripType, label: 'History' },
      { id: 'local-traditions' as TripType, label: 'Local traditions' },
    ],
  },
  {
    label: 'Relaxation',
    types: [
      { id: 'spa' as TripType, label: 'Spa & wellness' },
      { id: 'lounges' as TripType, label: 'Lounges' },
    ],
  },
  {
    label: 'Active',
    types: [
      { id: 'hiking' as TripType, label: 'Hiking' },
      { id: 'water-sports' as TripType, label: 'Water sports' },
      { id: 'wildlife' as TripType, label: 'Wildlife' },
    ],
  },
  {
    label: 'Food',
    types: [
      { id: 'street-food' as TripType, label: 'Street food' },
      { id: 'fine-dining' as TripType, label: 'Fine dining' },
      { id: 'food-tours' as TripType, label: 'Food tours' },
    ],
  },
  {
    label: 'Other',
    types: [
      { id: 'nightlife' as TripType, label: 'Nightlife' },
      { id: 'shopping' as TripType, label: 'Shopping' },
      { id: 'photography' as TripType, label: 'Photography' },
    ],
  },
];

const AVOIDANCE_OPTIONS = [
  { id: 'big-cities', label: 'Big cities' },
  { id: 'crowds', label: 'Crowds' },
  { id: 'tourist-traps', label: 'Tourist traps' },
  { id: 'heat', label: 'Hot weather' },
  { id: 'cold', label: 'Cold weather' },
  { id: 'long-drives', label: 'Long drives' },
  { id: 'long-walks', label: 'Long walks' },
  { id: 'early-mornings', label: 'Early mornings' },
  { id: 'late-nights', label: 'Late nights' },
  { id: 'spicy-food', label: 'Spicy food' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'alcohol', label: 'Alcohol-focused' },
];

// Pexels image arrays for mock data
const PEXELS_HOTEL_IMAGES = [
  'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
  'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
  'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
  'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg',
  'https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg',
  'https://images.pexels.com/photos/2507010/pexels-photo-2507010.jpeg',
];

const PEXELS_RESTAURANT_IMAGES = [
  'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg',
  'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
  'https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg',
  'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg',
  'https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg',
  'https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg',
];

const PEXELS_ACTIVITY_IMAGES = [
  'https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg',
  'https://images.pexels.com/photos/2387871/pexels-photo-2387871.jpeg',
  'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg',
  'https://images.pexels.com/photos/2104152/pexels-photo-2104152.jpeg',
  'https://images.pexels.com/photos/2440061/pexels-photo-2440061.jpeg',
  'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg',
];

const PEXELS_CAFE_IMAGES = [
  'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
  'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
  'https://images.pexels.com/photos/1813466/pexels-photo-1813466.jpeg',
  'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg',
  'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg',
];

function getMockPexelsImage(name: string, category: 'hotel' | 'restaurant' | 'activity' | 'cafe'): string {
  const images = category === 'hotel' ? PEXELS_HOTEL_IMAGES :
                 category === 'restaurant' ? PEXELS_RESTAURANT_IMAGES :
                 category === 'cafe' ? PEXELS_CAFE_IMAGES : PEXELS_ACTIVITY_IMAGES;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return `${images[Math.abs(hash) % images.length]}?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop`;
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Helper to get popular cities for a destination - extended lists with 15+ cities
function getCitiesForDestination(destination: string): string[] {
  const cityMap: Record<string, string[]> = {
    'Turkey': ['Istanbul', 'Cappadocia', 'Antalya', 'Bodrum', 'Ephesus', 'Pamukkale', 'Izmir', 'Ankara', 'Fethiye', 'Kas', 'Trabzon', 'Bursa', 'Konya', 'Dalyan', 'Oludeniz', 'Marmaris', 'Alanya', 'Side'],
    'Spain': ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada', 'San Sebastian', 'Bilbao', 'Malaga', 'Toledo', 'Cordoba', 'Ibiza', 'Ronda', 'Salamanca', 'Girona', 'Segovia', 'Cadiz', 'Marbella', 'Palma de Mallorca'],
    'Italy': ['Rome', 'Florence', 'Venice', 'Milan', 'Amalfi Coast', 'Cinque Terre', 'Naples', 'Tuscany', 'Bologna', 'Verona', 'Lake Como', 'Siena', 'Ravenna', 'Pisa', 'Sorrento'],
    'France': ['Paris', 'Nice', 'Lyon', 'Bordeaux', 'Marseille', 'Provence', 'Strasbourg', 'Mont Saint-Michel', 'Cannes', 'Avignon', 'Annecy', 'Colmar', 'Saint-Tropez', 'Chamonix', 'Carcassonne'],
    'Japan': ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Hakone', 'Kanazawa', 'Nikko', 'Fukuoka', 'Takayama', 'Nagoya', 'Kamakura', 'Naoshima', 'Kobe', 'Miyajima'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui', 'Ayutthaya', 'Pai', 'Chiang Rai', 'Koh Phi Phi', 'Koh Lanta', 'Koh Tao', 'Hua Hin', 'Koh Chang', 'Sukhothai', 'Kanchanaburi'],
    'Portugal': ['Lisbon', 'Porto', 'Sintra', 'Algarve', 'Madeira', 'Évora', 'Coimbra', 'Cascais', 'Lagos', 'Nazaré', 'Óbidos', 'Azores', 'Braga', 'Aveiro', 'Tavira'],
    'Greece': ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu', 'Meteora', 'Delphi', 'Thessaloniki', 'Naxos', 'Paros', 'Zakynthos', 'Hydra', 'Milos', 'Nafplio'],
    'Switzerland': ['Zurich', 'Lucerne', 'Interlaken', 'Zermatt', 'Geneva', 'Bern', 'Basel', 'Lausanne', 'St. Moritz', 'Gstaad', 'Grindelwald', 'Lugano', 'Montreux', 'Verbier', 'Davos', 'Lauterbrunnen', 'Wengen', 'Appenzell'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Dresden', 'Heidelberg', 'Rothenburg', 'Nuremberg', 'Bamberg', 'Freiburg', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Würzburg'],
    'UK': ['London', 'Edinburgh', 'Bath', 'Oxford', 'Cambridge', 'York', 'Liverpool', 'Manchester', 'Brighton', 'Bristol', 'Canterbury', 'Stratford-upon-Avon', 'Windsor', 'Cornwall', 'Lake District'],
    'England': ['London', 'Bath', 'Oxford', 'Cambridge', 'York', 'Liverpool', 'Manchester', 'Brighton', 'Bristol', 'Canterbury', 'Stratford-upon-Avon', 'Windsor', 'Cornwall', 'Lake District', 'Cotswolds'],
    'Scotland': ['Edinburgh', 'Glasgow', 'Isle of Skye', 'Inverness', 'St Andrews', 'Aberdeen', 'Stirling', 'Loch Ness', 'Highlands', 'Glencoe', 'Fort William', 'Oban', 'Isle of Mull', 'Orkney Islands', 'Dundee'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Delft', 'Leiden', 'Haarlem', 'Maastricht', 'Giethoorn', 'Kinderdijk', 'Keukenhof', 'Eindhoven', 'Groningen', 'Volendam', 'Zaanse Schans'],
    'Austria': ['Vienna', 'Salzburg', 'Innsbruck', 'Hallstatt', 'Graz', 'Linz', 'Kitzbühel', 'Bad Gastein', 'Zell am See', 'Melk', 'Dürnstein', 'St. Anton', 'Krems', 'Wachau Valley', 'Lech'],
    'Czech Republic': ['Prague', 'Český Krumlov', 'Brno', 'Karlovy Vary', 'Kutná Hora', 'Olomouc', 'Plzeň', 'Telč', 'Liberec', 'Český Ráj', 'Třebíč', 'Litomyšl', 'Kroměříž', 'Lednice', 'Mikulov'],
    'Croatia': ['Dubrovnik', 'Split', 'Zagreb', 'Plitvice Lakes', 'Hvar', 'Rovinj', 'Zadar', 'Korčula', 'Pula', 'Trogir', 'Šibenik', 'Mljet', 'Vis', 'Rab', 'Brač'],
    'Morocco': ['Marrakech', 'Fes', 'Chefchaouen', 'Casablanca', 'Essaouira', 'Tangier', 'Rabat', 'Sahara Desert', 'Agadir', 'Ouarzazate', 'Meknes', 'Asilah', 'Merzouga', 'Dades Valley', 'Ait Benhaddou'],
    'Egypt': ['Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Giza', 'Hurghada', 'Sharm El Sheikh', 'Abu Simbel', 'Dahab', 'Siwa Oasis', 'Valley of the Kings', 'Karnak', 'Edfu', 'Kom Ombo', 'White Desert'],
    'Vietnam': ['Hanoi', 'Ho Chi Minh City', 'Ha Long Bay', 'Hoi An', 'Da Nang', 'Sapa', 'Hue', 'Nha Trang', 'Phu Quoc', 'Ninh Binh', 'Dalat', 'Mui Ne', 'Can Tho', 'Phong Nha', 'Quy Nhon'],
    'Indonesia': ['Bali', 'Jakarta', 'Yogyakarta', 'Ubud', 'Lombok', 'Komodo', 'Raja Ampat', 'Bandung', 'Surabaya', 'Gili Islands', 'Labuan Bajo', 'Sulawesi', 'Sumatra', 'Flores', 'Malang'],
    'Bali': ['Ubud', 'Seminyak', 'Canggu', 'Uluwatu', 'Sanur', 'Nusa Penida', 'Kuta', 'Amed', 'Lovina', 'Munduk', 'Sidemen', 'Jimbaran', 'Tegallalang', 'Tanah Lot', 'Nusa Dua'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Great Barrier Reef', 'Uluru', 'Tasmania', 'Gold Coast', 'Cairns', 'Byron Bay', 'Kangaroo Island', 'Blue Mountains', 'Margaret River', 'Whitsundays'],
    'New Zealand': ['Auckland', 'Queenstown', 'Wellington', 'Rotorua', 'Milford Sound', 'Christchurch', 'Hobbiton', 'Bay of Islands', 'Wanaka', 'Fiordland', 'Tongariro', 'Abel Tasman', 'Kaikoura', 'Franz Josef', 'Coromandel'],
    'USA': ['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Miami', 'Las Vegas', 'Seattle', 'Boston', 'New Orleans', 'Washington DC', 'San Diego', 'Hawaii', 'Austin', 'Nashville', 'Portland'],
    'Mexico': ['Mexico City', 'Cancun', 'Tulum', 'Oaxaca', 'Playa del Carmen', 'San Miguel de Allende', 'Guanajuato', 'Puerto Vallarta', 'Merida', 'Sayulita', 'Cozumel', 'Valladolid', 'Puebla', 'Bacalar', 'San Cristobal'],
    'Peru': ['Lima', 'Cusco', 'Machu Picchu', 'Arequipa', 'Sacred Valley', 'Lake Titicaca', 'Nazca', 'Huacachina', 'Trujillo', 'Colca Canyon', 'Rainbow Mountain', 'Puno', 'Ica', 'Ollantaytambo', 'Paracas'],
    'Argentina': ['Buenos Aires', 'Mendoza', 'Patagonia', 'Iguazu Falls', 'Bariloche', 'Salta', 'Ushuaia', 'Córdoba', 'El Calafate', 'El Chaltén', 'Cafayate', 'Purmamarca', 'Tigre', 'La Plata', 'San Martín de los Andes'],
    'Brazil': ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Florianópolis', 'Paraty', 'Fernando de Noronha', 'Iguaçu Falls', 'Manaus', 'Bonito', 'Jericoacoara', 'Trancoso', 'Ouro Preto', 'Ilhabela', 'Búzios', 'Lençóis Maranhenses'],
    'Colombia': ['Bogotá', 'Medellín', 'Cartagena', 'Santa Marta', 'San Andrés', 'Tayrona', 'Villa de Leyva', 'Salento', 'Cali'],
    'South Korea': ['Seoul', 'Busan', 'Jeju Island', 'Gyeongju', 'Incheon', 'Jeonju', 'Suwon', 'Gangneung', 'Sokcho'],
    'China': ['Beijing', 'Shanghai', 'Hong Kong', 'Xi\'an', 'Guilin', 'Chengdu', 'Hangzhou', 'Suzhou', 'Zhangjiajie'],
    'India': ['Delhi', 'Mumbai', 'Jaipur', 'Agra', 'Varanasi', 'Kerala', 'Goa', 'Udaipur', 'Rishikesh'],
    'Singapore': ['Marina Bay', 'Sentosa', 'Chinatown', 'Little India', 'Orchard Road', 'Gardens by the Bay', 'Clarke Quay', 'Kampong Glam', 'Jurong'],
    'Malaysia': ['Kuala Lumpur', 'Penang', 'Langkawi', 'Malacca', 'Cameron Highlands', 'Borneo', 'Ipoh', 'Kota Kinabalu', 'Tioman Island'],
    'Philippines': ['Manila', 'Palawan', 'Boracay', 'Cebu', 'Siargao', 'Bohol', 'Baguio', 'Vigan', 'Coron'],
    'Iceland': ['Reykjavik', 'Blue Lagoon', 'Golden Circle', 'Vik', 'Akureyri', 'Jokulsarlon', 'Húsavík', 'Westfjords', 'Snæfellsnes'],
    'Norway': ['Oslo', 'Bergen', 'Tromsø', 'Lofoten Islands', 'Stavanger', 'Trondheim', 'Geirangerfjord', 'Ålesund', 'Svalbard'],
    'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Lapland', 'Visby', 'Kiruna', 'Öland', 'Dalarna'],
    'Denmark': ['Copenhagen', 'Aarhus', 'Odense', 'Skagen', 'Roskilde', 'Billund', 'Helsingør', 'Aalborg', 'Bornholm'],
    'Finland': ['Helsinki', 'Rovaniemi', 'Lapland', 'Turku', 'Tampere', 'Oulu', 'Savonlinna', 'Porvoo', 'Levi'],
    'Ireland': ['Dublin', 'Galway', 'Cork', 'Ring of Kerry', 'Cliffs of Moher', 'Killarney', 'Belfast', 'Dingle', 'Giant\'s Causeway'],
    'Belgium': ['Brussels', 'Bruges', 'Ghent', 'Antwerp', 'Leuven', 'Liège', 'Mechelen', 'Dinant', 'Ypres'],
    'Poland': ['Warsaw', 'Krakow', 'Gdańsk', 'Wrocław', 'Poznań', 'Zakopane', 'Łódź', 'Toruń', 'Auschwitz'],
    'Hungary': ['Budapest', 'Eger', 'Pécs', 'Debrecen', 'Szeged', 'Lake Balaton', 'Szentendre', 'Győr', 'Visegrád'],
    'Romania': ['Bucharest', 'Transylvania', 'Brașov', 'Sibiu', 'Cluj-Napoca', 'Bran Castle', 'Timișoara', 'Sighișoara', 'Maramureș'],
    'Bulgaria': ['Sofia', 'Plovdiv', 'Veliko Tarnovo', 'Bansko', 'Varna', 'Rila Monastery', 'Nessebar', 'Koprivshtitsa', 'Sozopol'],
    'Slovenia': ['Ljubljana', 'Lake Bled', 'Piran', 'Postojna', 'Maribor', 'Škocjan Caves', 'Soča Valley', 'Ptuj', 'Kranjska Gora'],
    'Montenegro': ['Kotor', 'Budva', 'Perast', 'Durmitor', 'Sveti Stefan', 'Cetinje', 'Herceg Novi', 'Ulcinj', 'Podgorica'],
    'Albania': ['Tirana', 'Berat', 'Gjirokastër', 'Saranda', 'Ksamil', 'Shkodër', 'Vlorë', 'Korçë', 'Butrint'],
    'Malta': ['Valletta', 'Mdina', 'Gozo', 'Comino', 'Sliema', 'St. Julian\'s', 'Blue Lagoon', 'Marsaxlokk', 'Rabat'],
    'Cyprus': ['Nicosia', 'Limassol', 'Paphos', 'Larnaca', 'Ayia Napa', 'Troodos', 'Kyrenia', 'Famagusta', 'Protaras'],
    'Israel': ['Tel Aviv', 'Jerusalem', 'Haifa', 'Dead Sea', 'Eilat', 'Nazareth', 'Acre', 'Caesarea', 'Masada'],
    'Jordan': ['Amman', 'Petra', 'Wadi Rum', 'Dead Sea', 'Aqaba', 'Jerash', 'Madaba', 'Dana', 'Ajloun'],
    'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Fujairah', 'Al Ain', 'Ajman', 'Hatta', 'Liwa'],
    'Dubai': ['Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Old Dubai', 'Jumeirah Beach', 'Dubai Creek', 'Business Bay', 'Al Barsha', 'Deira'],
    'South Africa': ['Cape Town', 'Johannesburg', 'Kruger National Park', 'Durban', 'Garden Route', 'Stellenbosch', 'Pretoria', 'Drakensberg', 'Port Elizabeth'],
    'Kenya': ['Nairobi', 'Masai Mara', 'Mombasa', 'Amboseli', 'Lake Nakuru', 'Diani Beach', 'Lamu', 'Tsavo', 'Mt Kenya'],
    'Tanzania': ['Dar es Salaam', 'Serengeti', 'Zanzibar', 'Kilimanjaro', 'Ngorongoro', 'Arusha', 'Stone Town', 'Lake Manyara', 'Tarangire'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Banff', 'Quebec City', 'Niagara Falls', 'Ottawa', 'Victoria', 'Whistler'],
    'Hawaii': ['Honolulu', 'Maui', 'Kauai', 'Big Island', 'Waikiki', 'Oahu', 'North Shore', 'Kona', 'Hilo', 'Lahaina', 'Kaanapali', 'Wailea', 'Hana', 'Poipu', 'Princeville'],
    'Cuba': ['Havana', 'Trinidad', 'Viñales', 'Varadero', 'Cienfuegos', 'Santiago de Cuba', 'Camagüey', 'Baracoa', 'Santa Clara'],
    'Costa Rica': ['San José', 'Arenal', 'Manuel Antonio', 'Monteverde', 'Tamarindo', 'Puerto Viejo', 'Tortuguero', 'Guanacaste', 'La Fortuna'],
  };

  // Check if destination matches a key (case-insensitive)
  const normalizedDest = destination.toLowerCase().trim();
  for (const [country, cities] of Object.entries(cityMap)) {
    if (normalizedDest === country.toLowerCase() ||
        normalizedDest.includes(country.toLowerCase()) ||
        country.toLowerCase().includes(normalizedDest)) {
      return cities;
    }
  }

  // Try partial matching for common variations
  const partialMatches: Record<string, string> = {
    'swiss': 'Switzerland',
    'greek': 'Greece',
    'italian': 'Italy',
    'spanish': 'Spain',
    'french': 'France',
    'german': 'Germany',
    'japanese': 'Japan',
    'thai': 'Thailand',
    'portuguese': 'Portugal',
    'turkish': 'Turkey',
    'dutch': 'Netherlands',
    'british': 'UK',
    'american': 'USA',
    'mexican': 'Mexico',
    'canadian': 'Canada',
    'australian': 'Australia',
    'korean': 'South Korea',
    'chinese': 'China',
    'indian': 'India',
    'brazilian': 'Brazil',
    'colombian': 'Colombia',
  };

  for (const [partial, country] of Object.entries(partialMatches)) {
    if (normalizedDest.includes(partial)) {
      return cityMap[country] || [];
    }
  }

  // Default: return destination as a single "city" option
  return [destination];
}

// Helper function to fetch real city images from API
async function fetchCityImage(city: string, country: string): Promise<string> {
  try {
    const response = await fetch(`/api/city-image?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch city image');
    }
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error(`Failed to fetch image for ${city}:`, error);
    return getCityImage(city, country);
  }
}

// Pipeline category colors - all distinct warm neutral tones
const PIPELINE_COLORS: Record<string, { bg: string; iconBg: string; text: string }> = {
  'Overview': { bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100 text-red-600', text: 'text-red-800' },
  'Schedule': { bg: 'bg-gray-50 border-gray-200', iconBg: 'bg-gray-100 text-gray-600', text: 'text-gray-800' },
  'Transport': { bg: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100 text-blue-600', text: 'text-blue-800' },
  'Hotels': { bg: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100 text-purple-600', text: 'text-purple-800' },
  'Food': { bg: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100 text-orange-600', text: 'text-orange-800' },
  'Activities': { bg: 'bg-yellow-50 border-yellow-200', iconBg: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-800' },
  'Packing': { bg: 'bg-amber-100 border-amber-300', iconBg: 'bg-amber-200 text-amber-700', text: 'text-amber-800' },
  'Docs': { bg: 'bg-lime-50 border-lime-200', iconBg: 'bg-lime-100 text-lime-600', text: 'text-lime-800' },
  'Budget': { bg: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-800' },
  'More': { bg: 'bg-stone-50 border-stone-200', iconBg: 'bg-stone-100 text-stone-600', text: 'text-stone-800' },
};

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [tripDna, setTripDna] = useState<TripDNA | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [foodModalDay, setFoodModalDay] = useState<DayPlan | null>(null);
  const [contentFilter, setContentFilter] = useState<string>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingOverviewIndex, setEditingOverviewIndex] = useState<number | null>(null);
  const [editedLocation, setEditedLocation] = useState('');
  const [expandedOverviewIndex, setExpandedOverviewIndex] = useState<number | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [editingHotelIndex, setEditingHotelIndex] = useState<number | null>(null);
  const [editingNights, setEditingNights] = useState<number>(1);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editedBudgetValue, setEditedBudgetValue] = useState('');
  const [expandedBudgetCategory, setExpandedBudgetCategory] = useState<string | null>(null);
  const [editingBudgetItem, setEditingBudgetItem] = useState<{ blockId: string; dayId: string } | null>(null);
  const [editedItemName, setEditedItemName] = useState('');
  const [editedItemAmount, setEditedItemAmount] = useState('');
  const [editingDestinations, setEditingDestinations] = useState(false);
  const [editedDestinations, setEditedDestinations] = useState('');
  const [planningFavorites, setPlanningFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'planning' | 'trip'>('planning'); // Default to planning for new/draft trips
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [isTripLocked, setIsTripLocked] = useState(true); // Default locked for imported trips
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Trip Hub state (must be declared at top level, not after early returns)
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [isSavingDates, setIsSavingDates] = useState(false);

  // Trip Hub - Dates extended state
  const [durationDays, setDurationDays] = useState(7);
  const [dateFlexibility, setDateFlexibility] = useState(0);

  // Trip Hub - Preferences state
  const [editTravelerType, setEditTravelerType] = useState<TravelerType>('couple');
  const [editBudget, setEditBudget] = useState<Budget>('$$');
  const [editPace, setEditPace] = useState<Pace>('balanced');
  const [editLodging, setEditLodging] = useState<LodgingType>('hotel');
  const [editArea, setEditArea] = useState<AreaType>('central');
  const [editTripTypes, setEditTripTypes] = useState<TripType[]>([]);
  const [editAvoidances, setEditAvoidances] = useState<string[]>([]);
  const [editSpecialRequests, setEditSpecialRequests] = useState('');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Trip Hub - Cities state (for SteppedCuration)
  const [tripStyles, setTripStyles] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [cityImages, setCityImages] = useState<Record<string, string>>({});
  const [isSavingCities, setIsSavingCities] = useState(false);

  // Trip Hub - Route state
  const [routeOrder, setRouteOrder] = useState<string[]>([]);
  const [isSavingRoute, setIsSavingRoute] = useState(false);

  // Trip Hub - Itinerary state
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);

  // Trip Hub - Saved Collections state
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedExpanded, setSavedExpanded] = useState(false);

  // Get all trips for the drawer
  const { trips, refresh: refreshTrips } = useDashboardData();


  // Drag and drop state
  const [dragState, setDragState] = useState<{
    blockId: string | null;
    sourceDayId: string | null;
    targetDayId: string | null;
    targetIndex: number | null;
  }>({
    blockId: null,
    sourceDayId: null,
    targetDayId: null,
    targetIndex: null,
  });

  useEffect(() => {
    async function loadTrip() {
      try {
        // Load from cloud/IndexedDB (cloud-first with local fallback)
        const storedTrip = await tripDb.get(tripId);

        // Also check localStorage for more recent local edits
        const localItineraryStr = localStorage.getItem(`itinerary-${tripId}`);
        let localItinerary: Itinerary | null = null;
        if (localItineraryStr) {
          try {
            localItinerary = JSON.parse(localItineraryStr);
            // Parse date strings
            if (localItinerary && typeof localItinerary.updatedAt === 'string') {
              localItinerary.updatedAt = new Date(localItinerary.updatedAt);
            }
            if (localItinerary && typeof localItinerary.createdAt === 'string') {
              localItinerary.createdAt = new Date(localItinerary.createdAt);
            }
            if (localItinerary?.aiMeta && typeof localItinerary.aiMeta.generatedAt === 'string') {
              localItinerary.aiMeta.generatedAt = new Date(localItinerary.aiMeta.generatedAt);
            }
          } catch {
            localItinerary = null;
          }
        }

        if (storedTrip) {
          setTripDna(storedTrip.tripDna);
          if (storedTrip.itinerary) {
            // Parse dates if they're strings (from JSON storage)
            const cloudItinerary = storedTrip.itinerary;
            if (typeof cloudItinerary.createdAt === 'string') {
              cloudItinerary.createdAt = new Date(cloudItinerary.createdAt);
            }
            if (typeof cloudItinerary.updatedAt === 'string') {
              cloudItinerary.updatedAt = new Date(cloudItinerary.updatedAt);
            }
            if (cloudItinerary.aiMeta && typeof cloudItinerary.aiMeta.generatedAt === 'string') {
              cloudItinerary.aiMeta.generatedAt = new Date(cloudItinerary.aiMeta.generatedAt);
            }

            // Use whichever itinerary is more recent (localStorage wins if newer)
            // This ensures local edits aren't lost when cloud sync is slow
            if (localItinerary && localItinerary.updatedAt && cloudItinerary.updatedAt) {
              const localTime = localItinerary.updatedAt.getTime();
              const cloudTime = cloudItinerary.updatedAt.getTime();
              if (localTime > cloudTime) {
                setItinerary(localItinerary);
                // Re-sync local to cloud since it's newer
                tripDb.updateItinerary(tripId, localItinerary);
              } else {
                setItinerary(cloudItinerary);
              }
            } else if (localItinerary) {
              setItinerary(localItinerary);
            } else {
              setItinerary(cloudItinerary);
            }
          } else if (localItinerary) {
            setItinerary(localItinerary);
          }
        } else {
          // Fallback to localStorage for backwards compatibility
          const storedTripDna = localStorage.getItem(`trip-dna-${tripId}`);
          if (storedTripDna) {
            setTripDna(JSON.parse(storedTripDna));
          }
          if (localItinerary) {
            setItinerary(localItinerary);
          }
        }
      } catch (error) {
        console.error('Error loading trip:', error);
        // Fallback to localStorage on error
        const storedTripDna = localStorage.getItem(`trip-dna-${tripId}`);
        if (storedTripDna) {
          setTripDna(JSON.parse(storedTripDna));
        }
        const storedItinerary = localStorage.getItem(`itinerary-${tripId}`);
        if (storedItinerary) {
          setItinerary(JSON.parse(storedItinerary));
        }
      }
      // Load documents for this trip
      const docs = await documentDb.getByTrip(tripId);
      setDocuments(docs);

      setLoading(false);
    }

    loadTrip();
  }, [tripId]);

  // Set view mode based on whether trip has a generated itinerary
  useEffect(() => {
    if (loading) return; // Wait for load to complete

    if (itinerary && itinerary.days.length > 0) {
      // Has generated itinerary - default to trip view
      setViewMode('trip');
    }
    // Draft trips now show Trip Hub on this page instead of redirecting to /plan
  }, [loading, itinerary]);

  // Initialize planning items from existing itinerary
  useEffect(() => {
    if (itinerary && planningItems.length === 0) {
      const items = itineraryToPlanningItems(itinerary);
      if (items.length > 0) {
        setPlanningItems(items);
      }
    }
  }, [itinerary, planningItems.length]);

  // Initialize edit dates and preferences from tripDna for Trip Hub
  useEffect(() => {
    if (tripDna) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dna = tripDna as any;

      // Initialize dates
      const start = dna.constraints?.dates?.startDate || dna.constraints?.startDate || '';
      const end = dna.constraints?.dates?.endDate || dna.constraints?.endDate || '';
      setEditStartDate(start);
      setEditEndDate(end);

      // Initialize duration
      const days = dna.constraints?.duration?.days || dna.constraints?.dates?.totalDays || 7;
      setDurationDays(days);

      // Initialize date flexibility
      const flexibility = dna.constraints?.dateFlexibility || 0;
      setDateFlexibility(flexibility);

      // Initialize preferences
      const travelerType = dna.travelerProfile?.partyType || dna.travelers?.type || 'couple';
      setEditTravelerType(travelerType);

      const budgetLevel = dna.constraints?.budget?.level || '$$';
      setEditBudget(budgetLevel);

      const pace = dna.vibeAndPace?.tripPace || 'balanced';
      setEditPace(pace);

      const lodging = dna.constraints?.lodging || 'hotel';
      setEditLodging(lodging);

      const area = dna.constraints?.area || 'central';
      setEditArea(area);

      const tripTypes = dna.travelerProfile?.travelIdentities || dna.interests?.tripTypes || [];
      setEditTripTypes(tripTypes);

      const avoidances = dna.preferences?.avoidances?.split(', ').filter(Boolean) ||
                        dna.constraints?.avoidances?.split(', ').filter(Boolean) || [];
      setEditAvoidances(avoidances);

      const specialRequests = dna.preferences?.specialRequests || '';
      setEditSpecialRequests(specialRequests);

      // Initialize cities
      const destination = dna.interests?.destination || dna.meta?.title || 'Your Trip';
      const destinations = dna.interests?.destinations || [destination];
      const cities = dna.interests?.selectedCities || [];
      setSelectedCities(cities);
      // Initialize route order from selected cities or destinations
      setRouteOrder(cities.length > 0 ? cities : destinations);

      // Fetch city images
      const allCities = getCitiesForDestination(destinations[0] || destination);
      allCities.forEach(async (city) => {
        try {
          const res = await fetch(`/api/city-image?city=${encodeURIComponent(city)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.imageUrl) {
              setCityImages(prev => ({ ...prev, [city]: data.imageUrl }));
            }
          }
        } catch (error) {
          console.error(`Failed to fetch image for ${city}:`, error);
        }
      });
    }
  }, [tripDna]);

  // Load saved places for this trip's destinations
  useEffect(() => {
    const loadSavedPlaces = async () => {
      if (!tripDna) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dna = tripDna as any;
      const destination = dna.interests?.destination || dna.meta?.title || '';
      const destinations = dna.interests?.destinations || [destination];
      const cities = selectedCities.length > 0 ? selectedCities : destinations;

      try {
        const allSaved = await savedPlacesDb.getAll();
        // Filter saved places by trip cities
        const tripSaved = allSaved.filter(place =>
          cities.some((city: string) =>
            place.city.toLowerCase().includes(city.toLowerCase()) ||
            city.toLowerCase().includes(place.city.toLowerCase())
          )
        );
        setSavedPlaces(tripSaved);
      } catch (error) {
        console.error('Failed to load saved places:', error);
      }
    };

    loadSavedPlaces();
  }, [tripDna, selectedCities]);

  // Save budget to itinerary when it changes
  const handleSaveBudget = async (newBudget: number) => {
    setTotalBudget(newBudget);

    if (!itinerary) return;

    const updatedItinerary = {
      ...itinerary,
      meta: {
        ...itinerary.meta,
        estimatedBudget: {
          ...itinerary.meta.estimatedBudget,
          total: newBudget,
        },
      },
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    await tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Update a budget item (name or amount)
  const handleUpdateBudgetItem = async (dayId: string, blockId: string, newName: string, newAmount: number) => {
    if (!itinerary) return;

    const updatedDays = itinerary.days.map(day => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        blocks: day.blocks.map(block => {
          if (block.id !== blockId || !block.activity) return block;
          return {
            ...block,
            activity: {
              ...block.activity,
              name: newName,
              cost: {
                ...block.activity.cost,
                amount: newAmount,
                currency: block.activity.cost?.currency || 'USD',
                isEstimate: false,
              },
            },
          };
        }),
      };
    });

    const updatedItinerary = { ...itinerary, days: updatedDays, updatedAt: new Date() };
    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));
    await tripDb.updateItinerary(tripId, updatedItinerary);
    setEditingBudgetItem(null);
  };

  // Delete a budget item (remove cost)
  const handleDeleteBudgetItem = async (dayId: string, blockId: string) => {
    if (!itinerary) return;

    const updatedDays = itinerary.days.map(day => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        blocks: day.blocks.map(block => {
          if (block.id !== blockId || !block.activity) return block;
          return {
            ...block,
            activity: {
              ...block.activity,
              cost: undefined,
              reservationStatus: 'not-started' as const,
            },
          };
        }),
      };
    });

    const updatedItinerary = { ...itinerary, days: updatedDays, updatedAt: new Date() };
    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));
    await tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Update destinations list
  const handleSaveDestinations = async (newDestinations: string) => {
    if (!itinerary) return;

    const updatedItinerary = {
      ...itinerary,
      meta: { ...itinerary.meta, destination: newDestinations.trim() },
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));
    await tripDb.updateItinerary(tripId, updatedItinerary);
    setEditingDestinations(false);
  };

  const handleDelete = async () => {
    await tripDb.delete(tripId);
    localStorage.removeItem(`trip-dna-${tripId}`);
    localStorage.removeItem(`itinerary-${tripId}`);
    router.push('/');
  };

  // Document upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !uploadingCategory) return;

    // Map category labels to document types
    const categoryToType: Record<string, StoredDocument['type']> = {
      'Health Insurance': 'pdf',
      'Travel Insurance': 'pdf',
      'Passport / Visa': 'pdf',
      'Flight Confirmations': 'booking',
      'Hotel Reservations': 'booking',
      'Car Rental': 'booking',
      'Activity Tickets': 'booking',
      'Payment & Cards': 'other',
    };

    for (const file of Array.from(files)) {
      const type = categoryToType[uploadingCategory] || 'other';
      const doc = await documentDb.add(tripId, `${uploadingCategory}: ${file.name}`, type, file);
      setDocuments(prev => [...prev, doc]);
    }

    // Reset
    setUploadingCategory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (docId: string) => {
    await documentDb.delete(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // Get documents for a specific category
  const getDocsForCategory = (category: string) => {
    return documents.filter(d => d.name.startsWith(`${category}:`));
  };

  // Update hotel nights
  const handleUpdateHotelNights = async (baseIndex: number, newNights: number) => {
    if (!itinerary) return;

    const bases = [...itinerary.route.bases];
    const base = bases[baseIndex];
    if (!base || !base.checkIn) return;

    // Calculate new checkout date
    const [year, month, day] = base.checkIn.split('-').map(Number);
    const checkInDate = new Date(year, month - 1, day);
    checkInDate.setDate(checkInDate.getDate() + newNights);
    const newCheckOut = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`;

    // Update base
    bases[baseIndex] = {
      ...base,
      nights: newNights,
      checkOut: newCheckOut,
    };

    const updatedItinerary = {
      ...itinerary,
      route: { ...itinerary.route, bases },
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    setEditingHotelIndex(null);

    // Persist to DB
    if (tripDna) {
      await tripDb.updateItinerary(tripId, updatedItinerary);
    }
  };

  const handleSaveTitle = async () => {
    if (!itinerary || !editedTitle.trim()) return;

    const updatedItinerary = {
      ...itinerary,
      meta: { ...itinerary.meta, title: editedTitle.trim() },
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));
    setIsEditing(false);

    // Sync to cloud
    if (tripDna) {
      tripDb.updateItinerary(tripId, updatedItinerary);
    }
  };

  const startEditing = () => {
    setEditedTitle(itinerary?.meta.title || '');
    setIsEditing(true);
  };

  const handleUpdateDay = (updatedDay: DayPlan) => {
    if (!itinerary) return;

    const updatedDays = itinerary.days.map(d =>
      d.id === updatedDay.id ? updatedDay : d
    );

    const updatedItinerary = {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Update location name for a range of days (used in overview editing)
  const handleUpdateOverviewLocation = (startDate: string, endDate: string, newLocation: string) => {
    if (!itinerary || !newLocation.trim()) return;

    // Update all days in the range:
    // 1. Set a custom location override field
    // 2. Update all activity locations to the new city
    const updatedDays = itinerary.days.map(day => {
      if (day.date >= startDate && day.date <= endDate) {
        // Update all activity locations to new city
        const updatedBlocks = day.blocks.map(block => {
          if (block.activity?.location) {
            return {
              ...block,
              activity: {
                ...block.activity,
                location: { ...block.activity.location, name: newLocation.trim() }
              }
            };
          }
          return block;
        });
        return { ...day, blocks: updatedBlocks, customLocation: newLocation.trim() };
      }
      return day;
    });

    const updatedItinerary = {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
    setEditingOverviewIndex(null);
  };

  // Drag and drop handlers
  const handleDragStart = (blockId: string, dayId: string) => {
    setDragState({
      blockId,
      sourceDayId: dayId,
      targetDayId: null,
      targetIndex: null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      blockId: null,
      sourceDayId: null,
      targetDayId: null,
      targetIndex: null,
    });
  };

  const handleDragOver = (dayId: string, index: number) => {
    setDragState(prev => ({
      ...prev,
      targetDayId: dayId,
      targetIndex: index,
    }));
  };

  const handleDrop = (targetDayId: string, targetIndex: number) => {
    if (!itinerary || !dragState.blockId || !dragState.sourceDayId) return;

    const sourceDay = itinerary.days.find(d => d.id === dragState.sourceDayId);
    const targetDay = itinerary.days.find(d => d.id === targetDayId);

    if (!sourceDay || !targetDay) return;

    const blockToMove = sourceDay.blocks.find(b => b.id === dragState.blockId);
    if (!blockToMove) return;

    // Remove from source
    const newSourceBlocks = sourceDay.blocks.filter(b => b.id !== dragState.blockId);

    // Add to target
    let newTargetBlocks: typeof targetDay.blocks;
    if (sourceDay.id === targetDay.id) {
      // Same day reordering
      const originalIndex = sourceDay.blocks.findIndex(b => b.id === dragState.blockId);
      const adjustedIndex = originalIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newTargetBlocks = [...newSourceBlocks];
      newTargetBlocks.splice(adjustedIndex, 0, blockToMove);
    } else {
      // Moving between days
      newTargetBlocks = [...targetDay.blocks];
      newTargetBlocks.splice(targetIndex, 0, blockToMove);
    }

    // Update days
    const updatedDays = itinerary.days.map(d => {
      if (d.id === sourceDay.id && d.id === targetDay.id) {
        return { ...d, blocks: newTargetBlocks };
      }
      if (d.id === sourceDay.id) {
        return { ...d, blocks: newSourceBlocks };
      }
      if (d.id === targetDay.id) {
        return { ...d, blocks: newTargetBlocks };
      }
      return d;
    });

    const updatedItinerary = {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));
    tripDb.updateItinerary(tripId, updatedItinerary);

    handleDragEnd();
  };

  const handleAddFoodRecommendation = (recommendation: FoodRecommendation) => {
    if (!itinerary) return;

    // Check if already exists
    const exists = itinerary.foodLayer.some(f => f.id === recommendation.id);
    if (exists) return;

    // Add to food layer
    const updatedFoodLayer = [...itinerary.foodLayer, recommendation];

    // Also add as a time block to the day's schedule
    const updatedDays = itinerary.days.map(day => {
      if (day.id !== recommendation.dayId) return day;

      // Create a food activity block
      const mealTimeToBlockType = {
        breakfast: 'morning-anchor',
        lunch: 'midday-flex',
        dinner: 'evening-vibe',
        snack: 'midday-flex',
      } as const;

      const blockType = recommendation.mealTime
        ? mealTimeToBlockType[recommendation.mealTime]
        : 'midday-flex';

      const foodBlock = {
        id: `block-${recommendation.id}`,
        type: blockType as 'morning-anchor' | 'midday-flex' | 'evening-vibe',
        activity: {
          id: recommendation.id,
          name: recommendation.name,
          category: 'food' as const,
          description: `${recommendation.cuisine} - ${recommendation.notes || ''}`,
          location: recommendation.location,
          duration: 60, // 1 hour default
          bookingRequired: recommendation.reservationRequired,
          tips: [],
          tags: [recommendation.cuisine, recommendation.mealTime || 'meal'],
        },
        priority: 'if-energy' as const,
        isLocked: false,
      };

      return {
        ...day,
        blocks: [...day.blocks, foodBlock],
      };
    });

    const updatedItinerary = {
      ...itinerary,
      foodLayer: updatedFoodLayer,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  const handleDeleteFoodRecommendation = (foodId: string) => {
    if (!itinerary) return;

    // Remove from food layer
    const updatedFoodLayer = itinerary.foodLayer.filter(f => f.id !== foodId);

    // Also remove from day schedules
    const updatedDays = itinerary.days.map(day => ({
      ...day,
      blocks: day.blocks.filter(block => block.activity?.id !== foodId),
    }));

    const updatedItinerary = {
      ...itinerary,
      foodLayer: updatedFoodLayer,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Airport code to city name mapping
  const AIRPORT_TO_CITY: Record<string, string> = {
    // Japan
    'NRT': 'Tokyo', 'HND': 'Tokyo', 'KIX': 'Osaka', 'ITM': 'Osaka',
    'NGO': 'Nagoya', 'CTS': 'Sapporo', 'FUK': 'Fukuoka', 'OKA': 'Okinawa',
    // Thailand
    'BKK': 'Bangkok', 'DMK': 'Bangkok', 'CNX': 'Chiang Mai', 'HKT': 'Phuket',
    'USM': 'Koh Samui', 'KBV': 'Krabi',
    // Vietnam
    'HAN': 'Hanoi', 'SGN': 'Ho Chi Minh City', 'DAD': 'Da Nang',
    'CXR': 'Nha Trang', 'PQC': 'Phu Quoc', 'HUI': 'Hue',
    // Southeast Asia
    'SIN': 'Singapore', 'KUL': 'Kuala Lumpur', 'MNL': 'Manila',
    'CGK': 'Jakarta', 'DPS': 'Bali', 'REP': 'Siem Reap', 'PNH': 'Phnom Penh',
    'RGN': 'Yangon', 'VTE': 'Vientiane', 'LPQ': 'Luang Prabang',
    // East Asia
    'HKG': 'Hong Kong', 'ICN': 'Seoul', 'GMP': 'Seoul', 'TPE': 'Taipei',
    'PEK': 'Beijing', 'PVG': 'Shanghai', 'SHA': 'Shanghai',
    // Europe
    'CDG': 'Paris', 'ORY': 'Paris', 'LHR': 'London', 'LGW': 'London',
    'STN': 'London', 'FCO': 'Rome', 'BCN': 'Barcelona', 'AMS': 'Amsterdam',
    'BER': 'Berlin', 'TXL': 'Berlin', 'MUC': 'Munich', 'VIE': 'Vienna',
    'ZRH': 'Zurich', 'GVA': 'Geneva', 'MAD': 'Madrid', 'LIS': 'Lisbon',
    // North America
    'JFK': 'New York', 'EWR': 'New York', 'LGA': 'New York',
    'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'YVR': 'Vancouver',
    'YYZ': 'Toronto', 'YUL': 'Montreal', 'YLW': 'Kelowna', 'SEA': 'Seattle',
    // Oceania
    'SYD': 'Sydney', 'MEL': 'Melbourne', 'AKL': 'Auckland', 'BNE': 'Brisbane',
    // Middle East
    'DXB': 'Dubai', 'DOH': 'Doha', 'AUH': 'Abu Dhabi',
    // Hawaii
    'HNL': 'Honolulu', 'OGG': 'Maui', 'LIH': 'Kauai',
  };

  // Get flags for multi-country destination string (e.g., "Thailand, Vietnam, Japan, Hawaii")
  // Returns string with flag before each country: "🇹🇭 Thailand, 🇻🇳 Vietnam, 🇯🇵 Japan, 🇺🇸 Hawaii"
  const getFlagsForDestination = (destination: string): string => {
    if (!destination) return '';
    const parts = destination.split(',').map(p => p.trim());
    return parts.map(part => {
      const flag = getFlagForLocation(part);
      return flag ? `${flag} ${part}` : part;
    }).join(', ');
  };

  // Convert airport code to city name - ALWAYS return city name, never airport code
  const airportToCity = (location: string): string => {
    if (!location) return '';
    const trimmed = location.trim();

    // Check if it's a direct airport code match
    const upperCode = trimmed.toUpperCase();
    if (AIRPORT_TO_CITY[upperCode]) {
      return AIRPORT_TO_CITY[upperCode];
    }

    // Check if location starts with airport code (e.g., "CNX, Thailand" or "CNX - Chiang Mai")
    const firstPart = trimmed.split(/[,\-–]/)[0].trim().toUpperCase();
    if (AIRPORT_TO_CITY[firstPart]) {
      return AIRPORT_TO_CITY[firstPart];
    }

    // Check if any 3-letter airport code appears in the string
    const codeMatch = trimmed.match(/\b([A-Z]{3})\b/i);
    if (codeMatch) {
      const matchedCode = codeMatch[1].toUpperCase();
      if (AIRPORT_TO_CITY[matchedCode]) {
        return AIRPORT_TO_CITY[matchedCode];
      }
    }

    // Return original but strip any trailing country/region after comma
    const cityPart = trimmed.split(',')[0].trim();
    return cityPart;
  };

  // Format date for display (e.g., "Mon, Feb 10")
  const formatDisplayDate = (dateStr: string): string => {
    // Parse as local date (avoid timezone issues)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    return `${weekday}, ${monthName} ${day}`;
  };

  // Calculate actual nights from consecutive base check-ins (base.nights data may be wrong)
  const getActualNights = (baseIndex: number): number => {
    if (!itinerary?.route?.bases) return 1;
    const bases = itinerary.route.bases;
    const base = bases[baseIndex];
    const nextBase = bases[baseIndex + 1];

    if (nextBase?.checkIn && base?.checkIn) {
      const [y1, m1, d1] = base.checkIn.split('-').map(Number);
      const [y2, m2, d2] = nextBase.checkIn.split('-').map(Number);
      const checkInDate = new Date(y1, m1 - 1, d1);
      const nextCheckInDate = new Date(y2, m2 - 1, d2);
      const diffDays = Math.round((nextCheckInDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) return diffDays;
    }

    return base?.nights || 1;
  };

  // Calculate checkout date from checkin + nights
  const getCheckOutDate = (checkIn: string, nights: number): string => {
    const [year, month, day] = checkIn.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + nights);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Normalize location names - merge equivalent places and convert airport codes
  const normalizeLocation = (location: string): string => {
    if (!location) return '';
    const trimmed = location.trim();
    const lower = trimmed.toLowerCase();

    // Airport code conversions
    if (trimmed.toUpperCase() === 'YLW') return 'Kelowna';
    if (trimmed.toUpperCase() === 'HNL') return 'Honolulu';
    if (trimmed.toUpperCase() === 'OGG') return 'Maui';
    if (trimmed.toUpperCase() === 'NRT') return 'Tokyo';

    // Merge airport cities to main city (Narita is Tokyo's airport)
    if (lower === 'narita' || lower.includes('narita')) return 'Tokyo';
    if (lower === 'tokyo narita') return 'Tokyo';
    if (lower === 'haneda' || lower.includes('haneda')) return 'Tokyo';

    // Merge equivalent locations (Oahu = Honolulu, they're the same place)
    if (lower === 'oahu' || lower.includes('oahu')) return 'Honolulu';
    if (lower === 'waikiki' || lower.includes('waikiki')) return 'Honolulu';

    // Use airportToCity for any remaining codes
    const converted = airportToCity(trimmed);
    return converted;
  };

  // Get the BASE CITY for a day - analyze the schedule to find where you SLEEP that night
  // Always normalizes the result (converts airport codes, merges Oahu/Honolulu, etc.)
  const getCityForDay = (day: DayPlan): string => {
    if (!itinerary) return '';

    // 0. Check if user manually edited this location
    if ((day as DayPlan & { customLocation?: string }).customLocation) {
      return normalizeLocation((day as DayPlan & { customLocation?: string }).customLocation!);
    }

    // 1. PRIMARY: Check baseId - this is the authoritative source for where you sleep
    if ((day as DayPlan & { baseId?: string }).baseId) {
      const base = itinerary.route.bases.find(b => b.id === (day as DayPlan & { baseId?: string }).baseId);
      if (base) {
        return normalizeLocation(base.location);
      }
    }

    // 2. Fallback: Check for accommodation activity - that's where you sleep
    const accommodationBlock = day.blocks.find(b =>
      b.activity?.category === 'accommodation' ||
      b.activity?.category === 'checkin'
    );
    if (accommodationBlock?.activity) {
      // Try location.name first, then fall back to parsing hotel name
      if (accommodationBlock.activity.location?.name) {
        return normalizeLocation(accommodationBlock.activity.location.name);
      }
      // Parse hotel name for location hints (e.g., "Hotel Nikko Narita" → Tokyo)
      const hotelName = accommodationBlock.activity.name || '';
      if (hotelName.toLowerCase().includes('narita')) return 'Tokyo';
      if (hotelName.toLowerCase().includes('haneda')) return 'Tokyo';
    }

    // 3. Check for flight - handle overnight flights specially
    const flightBlocks = day.blocks.filter(b => b.activity?.category === 'flight');
    if (flightBlocks.length > 0) {
      // Map common airport codes to city names
      const airportToCityMap: Record<string, string> = {
        'NRT': 'Tokyo', 'HND': 'Tokyo', 'KIX': 'Osaka',
        'BKK': 'Bangkok', 'CNX': 'Chiang Mai', 'HKT': 'Phuket',
        'SIN': 'Singapore', 'HKG': 'Hong Kong', 'ICN': 'Seoul',
        'TPE': 'Taipei', 'YVR': 'Vancouver', 'YYZ': 'Toronto',
        'YLW': 'Kelowna', 'YYC': 'Calgary', 'YEG': 'Edmonton',
        'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'JFK': 'New York',
        'LHR': 'London', 'CDG': 'Paris', 'FCO': 'Rome',
        'DAN': 'Da Nang', 'DAD': 'Da Nang', 'SGN': 'Ho Chi Minh',
        'HAN': 'Hanoi', 'REP': 'Siem Reap', 'KUL': 'Kuala Lumpur',
        'HNL': 'Honolulu', 'OGG': 'Maui', 'LIH': 'Kauai',
      };

      const lastFlight = flightBlocks[flightBlocks.length - 1];
      const flightName = lastFlight?.activity?.name || '';

      // Check if this is an overnight flight (+1 or +2 in name)
      const isOvernightFlight = /\+[12]/.test(flightName);

      const codeMatch = flightName.match(/([A-Z]{3})\s*[-–→]\s*([A-Z]{3})/);

      if (codeMatch) {
        // For overnight flights, return ORIGIN city (you depart that day, arrive next day)
        // For same-day flights, return DESTINATION (you arrive that day)
        const cityCode = isOvernightFlight ? codeMatch[1] : codeMatch[2];
        return normalizeLocation(airportToCityMap[cityCode] || cityCode);
      }

      // Try to parse destination from flight name formats:
      // "Bangkok → Chiang Mai" or "City A - City B" (but not times like 9:50am-1:00pm)
      const cityMatch = flightName.match(/([A-Za-z][A-Za-z\s]+)\s*[→–]\s*([A-Za-z][A-Za-z\s]+?)(?:\s|$)/);
      if (cityMatch && !cityMatch[2].match(/\d/)) {
        return normalizeLocation(cityMatch[2].trim());
      }

      // Fallback to location if can't parse
      if (lastFlight?.activity?.location?.name) {
        return normalizeLocation(lastFlight.activity.location.name);
      }
    }

    // 4. Check any activity's location - they should all be in same city for that day
    for (const block of day.blocks) {
      if (block.activity?.location?.name) {
        return normalizeLocation(block.activity.location.name);
      }
    }

    // 5. Final fallback to base data by date range (legacy)
    for (const base of itinerary.route.bases) {
      if (day.date >= base.checkIn && day.date < base.checkOut) {
        return normalizeLocation(base.location);
      }
    }

    return '';
  };

  // Get location for a specific day - uses the base city (where you sleep)
  const getLocationForDay = (day: DayPlan): string => {
    // Just use getCityForDay - it returns the city from base.location
    return getCityForDay(day);
  };

  // Build location groups - SINGLE SOURCE OF TRUTH for both Overview and Map
  // Groups consecutive days at the same location
  const locationGroups = useMemo(() => {
    if (!itinerary?.days || itinerary.days.length === 0) return [];

    // Get full date range - use tripDna start date if available (includes departure day)
    const tripStartDate = tripDna?.constraints?.dates?.startDate;
    const sortedDays = [...itinerary.days].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = tripStartDate || sortedDays[0].date;
    const lastDate = sortedDays[sortedDays.length - 1].date;

    const [y1, m1, d1] = firstDate.split('-').map(Number);
    const [y2, m2, d2] = lastDate.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);

    // Build a map of date -> day for fast lookup
    const daysByDate: Record<string, DayPlan> = {};
    itinerary.days.forEach(day => {
      daysByDate[day.date] = day;
    });

    // Helper to format date as YYYY-MM-DD
    const toDateStr = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Group consecutive days by location
    const groups: { location: string; startDate: string; endDate: string; startDay: number; endDay: number; nights: number }[] = [];
    let dayNum = 1;
    const current = new Date(start);
    let lastLocation = '';

    while (current <= end) {
      const dateStr = toDateStr(current);
      const existingDay = daysByDate[dateStr];

      let location: string;
      if (existingDay) {
        location = getCityForDay(existingDay);
      } else {
        location = lastLocation || itinerary.meta.destination || 'Unknown';
      }

      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.location === location) {
        lastGroup.endDate = dateStr;
        lastGroup.endDay = dayNum;
        // Nights = number of days at this location (inclusive)
        lastGroup.nights = lastGroup.endDay - lastGroup.startDay + 1;
      } else {
        groups.push({
          location,
          startDate: dateStr,
          endDate: dateStr,
          startDay: dayNum,
          endDay: dayNum,
          nights: 1,
        });
      }

      lastLocation = location;
      dayNum++;
      current.setDate(current.getDate() + 1);
    }

    return groups;
  }, [itinerary, tripDna, getCityForDay]);

  // Build bases for the map from locationGroups
  const sortedBases = useMemo(() => {
    if (locationGroups.length === 0) return itinerary?.route?.bases || [];

    // Extract cities in order from groups (allows duplicates like Tokyo→...→Tokyo)
    const orderedCities = locationGroups.map(g => g.location);

    // Map to base objects for the map component
    const bases = itinerary?.route?.bases || [];
    return orderedCities.map((city, index) => {
      const matchingBase = bases.find(b => {
        const baseCity = normalizeLocation(b.location?.split(',')[0] || '');
        return baseCity.toLowerCase() === city.toLowerCase();
      });

      return matchingBase || {
        id: `city-${index}`,
        location: city,
        nights: locationGroups[index]?.nights || 1,
        checkIn: locationGroups[index]?.startDate || '',
        checkOut: locationGroups[index]?.endDate || '',
        rationale: '',
      };
    });
  }, [locationGroups, itinerary, normalizeLocation]);

  // Calculate booked expenses by category (only items with reservationStatus === 'done')
  interface BudgetItem {
    id: string;
    blockId: string;
    dayId: string;
    name: string;
    amount: number;
    currency: string;
    category: string;
  }

  const bookedExpenses = useMemo(() => {
    if (!itinerary) return {
      transport: 0, accommodation: 0, food: 0, activities: 0, total: 0,
      transportItems: [] as BudgetItem[], accommodationItems: [] as BudgetItem[],
      foodItems: [] as BudgetItem[], activityItems: [] as BudgetItem[]
    };

    let transport = 0;
    let accommodation = 0;
    let food = 0;
    let activities = 0;
    const transportItems: BudgetItem[] = [];
    const accommodationItems: BudgetItem[] = [];
    const foodItems: BudgetItem[] = [];
    const activityItems: BudgetItem[] = [];

    // Iterate through all days and blocks
    for (const day of itinerary.days) {
      for (const block of day.blocks) {
        const activity = block.activity;
        if (!activity?.cost?.amount) continue;

        // Only count if booked (reservationStatus === 'done')
        if (activity.reservationStatus !== 'done') continue;

        const amount = activity.cost.amount;
        const category = activity.category;
        const item: BudgetItem = {
          id: activity.id,
          blockId: block.id,
          dayId: day.id,
          name: activity.name,
          amount,
          currency: activity.cost.currency || 'USD',
          category,
        };

        // Categorize the expense
        if (category === 'flight' || category === 'transit') {
          transport += amount;
          transportItems.push(item);
        } else if (category === 'accommodation' || category === 'checkin') {
          accommodation += amount;
          accommodationItems.push(item);
        } else if (category === 'food') {
          food += amount;
          foodItems.push(item);
        } else {
          // Activities, shopping, sightseeing, etc.
          activities += amount;
          activityItems.push(item);
        }
      }
    }

    // Note: Movement costs are NOT added here because flights/transit already
    // appear as day activities with category 'flight' or 'transit'. Adding
    // movements would cause double-counting.

    return {
      transport,
      accommodation,
      food,
      activities,
      total: transport + accommodation + food + activities,
      transportItems,
      accommodationItems,
      foodItems,
      activityItems,
    };
  }, [itinerary]);

  // Calculate total planned cost from ALL activities (not just booked ones)
  const totalPlannedCost = useMemo(() => {
    if (!itinerary) return 0;

    let total = 0;

    // Sum all activity costs from days
    // Note: This includes flights/transit which appear as day activities.
    // We do NOT add movements separately as that would cause double-counting.
    for (const day of itinerary.days) {
      for (const block of day.blocks) {
        const activity = block.activity;
        if (activity?.cost?.amount) {
          total += activity.cost.amount;
        }
      }
    }

    return total;
  }, [itinerary]);

  // Initialize total budget from calculated costs (sum of all activities in Schedule)
  useEffect(() => {
    if (totalPlannedCost > 0) {
      setTotalBudget(totalPlannedCost);
    }
  }, [totalPlannedCost]);

  // Regenerate packing list based on trip activities
  const handleRegeneratePackingList = () => {
    if (!itinerary) return;

    const newPackingList = generatePackingList(itinerary, tripDna);

    const updatedItinerary = {
      ...itinerary,
      packingLayer: newPackingList,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Fix flight durations by parsing "Xhr flight" from notes/description
  const handleFixFlightDurations = () => {
    if (!itinerary) return;

    const result = fixFlightDurations(itinerary);

    if (result.fixedCount === 0) {
      alert('No flight durations needed fixing. All durations look correct!');
      return;
    }

    setItinerary(result.itinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(result.itinerary));

    // Also update IndexedDB
    tripDb.get(tripId).then(stored => {
      if (stored) {
        tripDb.save({ ...stored, itinerary: result.itinerary });
      }
    });

    const detailsMsg = result.details.length > 0
      ? '\n\nFixed:\n' + result.details.join('\n')
      : '';
    alert(`Fixed ${result.fixedCount} flight duration(s)!${detailsMsg}`);
  };

  // Fix airport code typos (e.g., KLW → YLW)
  const handleFixAirportCodes = () => {
    if (!itinerary) return;

    const result = fixAirportCodes(itinerary);

    if (result.fixedCount === 0) {
      alert('No airport code typos found!');
      return;
    }

    setItinerary(result.itinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(result.itinerary));

    // Also update IndexedDB
    tripDb.get(tripId).then(stored => {
      if (stored) {
        tripDb.save({ ...stored, itinerary: result.itinerary });
      }
    });

    const detailsMsg = result.details.length > 0
      ? '\n\nFixed:\n' + result.details.join('\n')
      : '';
    alert(`Fixed ${result.fixedCount} airport code(s)!${detailsMsg}`);
  };

  // Calculate total trip days from date range (not just days with activities)
  const getTotalTripDays = (): number => {
    if (!itinerary?.days?.length) return 0;

    // Use tripDna start date if available (includes departure day)
    const tripStartDate = tripDna?.constraints?.dates?.startDate;
    const firstDate = tripStartDate || itinerary.days[0]?.date;
    const lastDate = itinerary.days[itinerary.days.length - 1]?.date;

    if (!firstDate || !lastDate) return itinerary.days.length;

    const [y1, m1, d1] = firstDate.split('-').map(Number);
    const [y2, m2, d2] = lastDate.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);

    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Auto-generate packing list if empty
  useEffect(() => {
    if (itinerary && isPackingListEmpty(itinerary.packingLayer)) {
      handleRegeneratePackingList();
    }
  }, [itinerary?.id]); // Only run when itinerary loads

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (!tripDna) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Trip Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t find this trip. It may have been deleted or the link is incorrect.
            </p>
            <Link href="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Save dates to tripDna
  const handleSaveDates = async () => {
    if (!tripDna) return;
    setIsSavingDates(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedDna: any = {
        ...tripDna,
        constraints: {
          ...(tripDna as any).constraints,
          dates: {
            ...((tripDna as any).constraints?.dates || {}),
            type: 'fixed',
            startDate: editStartDate || undefined,
            endDate: editEndDate || undefined,
          },
        },
        updatedAt: new Date(),
      };

      // Update title with new year if dates changed
      if (editStartDate) {
        const year = new Date(editStartDate).getFullYear();
        const dest = updatedDna.interests?.destination || updatedDna.interests?.destinations?.[0] || 'Trip';
        updatedDna.meta = {
          ...updatedDna.meta,
          title: `${dest} ${year}`,
        };
      }

      await tripDb.save({
        id: tripId,
        tripDna: updatedDna,
        itinerary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
        status: 'draft',
      });

      setTripDna(updatedDna);
      setExpandedSection(null); // Collapse section after save
    } catch (error) {
      console.error('Failed to save dates:', error);
    } finally {
      setIsSavingDates(false);
    }
  };

  // Save preferences to tripDna
  const handleSavePreferences = async () => {
    if (!tripDna) return;
    setIsSavingPreferences(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedDna: any = {
        ...tripDna,
        travelerProfile: {
          ...(tripDna as any).travelerProfile,
          partyType: editTravelerType,
          travelIdentities: editTripTypes,
        },
        vibeAndPace: {
          ...(tripDna as any).vibeAndPace,
          tripPace: editPace,
        },
        constraints: {
          ...(tripDna as any).constraints,
          budget: {
            ...((tripDna as any).constraints?.budget || {}),
            level: editBudget,
          },
          lodging: editLodging,
          area: editArea,
        },
        interests: {
          ...(tripDna as any).interests,
          tripTypes: editTripTypes,
        },
        preferences: {
          ...(tripDna as any).preferences,
          avoidances: editAvoidances.join(', '),
          specialRequests: editSpecialRequests || undefined,
        },
        updatedAt: new Date(),
      };

      await tripDb.save({
        id: tripId,
        tripDna: updatedDna,
        itinerary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
        status: 'draft',
      });

      setTripDna(updatedDna);
      setExpandedSection(null); // Collapse section after save
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Toggle trip type selection
  const toggleTripType = (type: TripType) => {
    setEditTripTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Toggle avoidance selection
  const toggleAvoidance = (id: string) => {
    setEditAvoidances(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Toggle city selection
  const toggleCity = (city: string) => {
    setSelectedCities(prev => {
      const newCities = prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city];
      // Also update route order when cities change
      if (!prev.includes(city)) {
        setRouteOrder(current => [...current, city]);
      } else {
        setRouteOrder(current => current.filter(c => c !== city));
      }
      return newCities;
    });
  };

  // Save cities to tripDna
  const handleSaveCities = async () => {
    if (!tripDna) return;
    setIsSavingCities(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dna = tripDna as any;
      const updatedTripDna = {
        ...dna,
        interests: {
          ...dna.interests,
          selectedCities: selectedCities,
        },
      };

      setTripDna(updatedTripDna);
      await tripDb.updateTripDna(tripId, updatedTripDna);
      setExpandedSection(null);
    } catch (error) {
      console.error('Failed to save cities:', error);
    } finally {
      setIsSavingCities(false);
    }
  };

  // Move city up in route order
  const moveRouteCity = (city: string, direction: 'up' | 'down') => {
    setRouteOrder(prev => {
      const index = prev.indexOf(city);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const newOrder = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
      return newOrder;
    });
  };

  // Save route to tripDna
  const handleSaveRoute = async () => {
    if (!tripDna) return;
    setIsSavingRoute(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dna = tripDna as any;
      const updatedTripDna = {
        ...dna,
        interests: {
          ...dna.interests,
          routeOrder: routeOrder,
        },
      };

      setTripDna(updatedTripDna);
      await tripDb.updateTripDna(tripId, updatedTripDna);
      setExpandedSection(null);
    } catch (error) {
      console.error('Failed to save route:', error);
    } finally {
      setIsSavingRoute(false);
    }
  };

  // Generate itinerary
  const handleGenerateItinerary = async () => {
    if (!tripDna) return;
    setIsGeneratingItinerary(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dna = tripDna as any;
      const startDateStr = dna.constraints?.dates?.startDate || dna.constraints?.startDate;
      const endDateStr = dna.constraints?.dates?.endDate || dna.constraints?.endDate;
      const cities = selectedCities.length > 0 ? selectedCities : routeOrder;

      // Calculate number of days
      let numDays = durationDays;
      if (startDateStr && endDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

      // Distribute days among cities
      const daysPerCity = Math.max(1, Math.floor(numDays / Math.max(1, cities.length)));

      // Create bases for each city
      const bases = cities.map((city, idx) => ({
        id: `base-${idx + 1}`,
        name: city,
        city: city,
        country: '',
        checkIn: '',
        checkOut: '',
        nights: daysPerCity,
      }));

      // Create day plans
      const days = [];
      let currentDate = startDateStr ? new Date(startDateStr) : new Date();

      for (let i = 0; i < numDays; i++) {
        const cityIndex = Math.min(Math.floor(i / daysPerCity), cities.length - 1);
        const baseId = `base-${cityIndex + 1}`;

        days.push({
          id: `day-${i + 1}`,
          dayNumber: i + 1,
          date: currentDate.toISOString().split('T')[0],
          baseId: baseId,
          theme: `Exploring ${cities[cityIndex] || 'destination'}`,
          blocks: [],
        });

        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }

      // Create itinerary with flexible structure using type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newItinerary: any = {
        id: tripId,
        tripDnaId: tripId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        meta: {
          title: dna.meta?.title || `Trip to ${cities[0] || 'Your destination'}`,
          destination: cities[0] || 'destination',
          destinations: cities,
          startDate: startDateStr || new Date().toISOString().split('T')[0],
          endDate: endDateStr || currentDate.toISOString().split('T')[0],
          totalDays: numDays,
          estimatedBudget: {
            accommodation: 0,
            activities: 0,
            food: 0,
            transport: 0,
            misc: 0,
            total: 0,
            perDay: 0,
            currency: 'USD',
          },
        },
        route: {
          bases: bases,
          movements: [],
        },
        days,
        packingList: [],
      };

      setItinerary(newItinerary);
      localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(newItinerary));
      await tripDb.updateItinerary(tripId, newItinerary);
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  // If no itinerary yet, show Trip Hub with collapsible sections
  if (!itinerary) {
    // Use type assertion for flexible tripDna structure from different sources
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dna = tripDna as any;
    const destination = dna.interests?.destination || dna.meta?.title || 'Your Trip';

    // Parse destinations - handle comma-separated strings and arrays
    const parseDestinations = (dest: string): string[] => {
      if (dest.includes(',')) return dest.split(',').map(d => d.trim());
      if (dest.includes(' - ')) return dest.split(' - ').map(d => d.trim());
      return [dest];
    };

    const rawDestinations = dna.interests?.destinations;
    const destinations = (rawDestinations && rawDestinations.length > 0)
      ? rawDestinations
      : parseDestinations(destination);
    const startDate = dna.constraints?.dates?.startDate || dna.constraints?.startDate;
    const endDate = dna.constraints?.dates?.endDate || dna.constraints?.endDate;
    const duration = dna.constraints?.duration?.days || dna.constraints?.dates?.totalDays || 7;
    const budgetLevel = dna.constraints?.budget?.level || null;
    const pace = dna.vibeAndPace?.tripPace || null;
    const tripTypes = dna.travelerProfile?.travelIdentities || dna.interests?.tripTypes || [];

    // Generate title: "Destination Year" or "Multi-country Year"
    const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
    const title = dna.meta?.title || (destinations.length > 1 ? `Multi-country ${year}` : `${destinations[0]} ${year}`);
    const subtitle = destinations.length > 1 ? `Exploring ${destinations.join(', ')}` : undefined;

    // Status helpers
    const hasDates = startDate && endDate;
    const hasPreferences = budgetLevel || pace || tripTypes.length > 0;

    // Parse dates without timezone shift (YYYY-MM-DD format)
    const formatDateLocal = (dateStr: string, includeYear = false) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(includeYear && { year: 'numeric' })
      });
    };

    const dateDisplay = hasDates
      ? `${formatDateLocal(startDate)} - ${formatDateLocal(endDate, true)}`
      : 'Dates not set';

    const toggleSection = (section: string) => {
      const newSection = expandedSection === section ? null : section;
      setExpandedSection(newSection);

      // Scroll to section when expanding
      if (newSection) {
        setTimeout(() => {
          const element = document.getElementById(`section-${newSection}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }

      // Load cities when cities section expands
      if (newSection === 'cities' && planningItems.length === 0) {
        const loadCities = async () => {
          const mockItems: PlanningItem[] = [];
          for (let destIdx = 0; destIdx < destinations.length; destIdx++) {
            const dest = destinations[destIdx];
            const cityNames = getCitiesForDestination(dest);
            for (let idx = 0; idx < cityNames.length; idx++) {
              const city = cityNames[idx];
              let imageUrl: string;
              try {
                imageUrl = await fetchCityImage(city, dest);
              } catch {
                imageUrl = getCityImage(city, dest);
              }
              mockItems.push({
                id: `city-${destIdx}-${idx}`,
                name: city,
                description: `Explore ${city}`,
                imageUrl,
                category: 'activities',
                tags: ['cities', dest],
              });
            }
          }
          setPlanningItems(mockItems);
        };
        loadCities();
      }
    };

    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Back button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 -ml-2"
              onClick={() => router.push('/')}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* Hero Image */}
          <TripHubHero
            destinations={destinations}
            title={title}
            subtitle={subtitle}
          />

          {/* 5 Collapsible Sections */}
          <div className="space-y-3">
            {/* Dates Section */}
            <TripHubSection
              id="section-dates"
              icon={<Calendar className="w-5 h-5" />}
              title="Dates"
              status={dateDisplay}
              buttonText="Edit"
              onButtonClick={() => toggleSection('dates')}
              expanded={expandedSection === 'dates'}
              onToggle={() => toggleSection('dates')}
            >
              <div className="space-y-6">
                {/* Duration Slider */}
                <div>
                  <div className="text-sm font-medium mb-2">How long?</div>
                  <Slider
                    value={[durationDays]}
                    onValueChange={([v]) => setDurationDays(v)}
                    min={1}
                    max={30}
                    step={1}
                    className="mb-2"
                  />
                  <div className="text-center text-sm font-medium">
                    {durationDays} {durationDays === 1 ? 'day' : 'days'}
                  </div>
                </div>

                {/* Travel Dates */}
                <div>
                  <div className="text-sm font-medium mb-2">Travel dates</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Start date</label>
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">End date</label>
                      <Input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        min={editStartDate}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {editStartDate && editEndDate && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {(() => {
                        const start = new Date(editStartDate);
                        const end = new Date(editEndDate);
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        return `${days} day${days !== 1 ? 's' : ''} selected`;
                      })()}
                    </div>
                  )}
                </div>

                {/* Date Flexibility */}
                <div>
                  <div className="text-sm font-medium mb-2">Date flexibility</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 0, label: 'Exact dates' },
                      { value: 1, label: '± 1 day' },
                      { value: 2, label: '± 2 days' },
                      { value: 3, label: '± 3 days' },
                      { value: 7, label: '± 1 week' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setDateFlexibility(value)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          dateFlexibility === value ? 'bg-primary text-primary-foreground border-primary' : 'border-muted hover:border-primary/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditStartDate(startDate || '');
                      setEditEndDate(endDate || '');
                      setDurationDays(duration);
                      setExpandedSection(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDates}
                    disabled={isSavingDates}
                  >
                    {isSavingDates ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </TripHubSection>

            {/* Preferences Section */}
            <TripHubSection
              id="section-preferences"
              icon={<Heart className="w-5 h-5" />}
              title="Preferences"
              status={hasPreferences ? `${budgetLevel || ''} ${pace ? `• ${pace}` : ''}`.trim() : 'Not set'}
              buttonText="Edit"
              onButtonClick={() => toggleSection('preferences')}
              expanded={expandedSection === 'preferences'}
              onToggle={() => toggleSection('preferences')}
            >
              <div className="space-y-6">
                {/* Who's Going - Full Width */}
                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-3">Who&apos;s going?</div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['solo', 'couple', 'friends', 'family'] as TravelerType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setEditTravelerType(t)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          editTravelerType === t ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                        }`}
                      >
                        <div className="text-sm font-medium">{t.charAt(0).toUpperCase() + t.slice(1)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget & Pace - Two Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-3">Budget</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['$', '$$', '$$$'] as Budget[]).map((b) => (
                        <button
                          key={b}
                          onClick={() => setEditBudget(b)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            editBudget === b ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium text-sm">{b}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-3">Pace</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['relaxed', 'balanced', 'active'] as Pace[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setEditPace(p)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            editPace === p ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium text-xs">{p.charAt(0).toUpperCase() + p.slice(1)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lodging & Area - Two Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-3">Lodging</div>
                    <div className="grid grid-cols-2 gap-2">
                      {LODGING_OPTIONS.map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => setEditLodging(id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            editLodging === id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium text-sm">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-3">Area</div>
                    <div className="grid grid-cols-2 gap-2">
                      {AREA_OPTIONS.map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => setEditArea(id)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            editArea === id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium text-sm">{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interests - Full Width */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">Interests</div>
                    {editTripTypes.length > 0 && (
                      <span className="text-sm text-muted-foreground">{editTripTypes.length} selected</span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {TRIP_TYPE_CATEGORIES.map((category) => (
                      <div key={category.label}>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">{category.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {category.types.map(({ id, label }) => (
                            <button
                              key={id}
                              onClick={() => toggleTripType(id)}
                              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                                editTripTypes.includes(id)
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'border-muted hover:border-primary/30'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Things to Avoid - Full Width */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">Things to avoid</div>
                    {editAvoidances.length > 0 && (
                      <span className="text-sm text-muted-foreground">{editAvoidances.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVOIDANCE_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => toggleAvoidance(id)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                          editAvoidances.includes(id)
                            ? 'bg-destructive/10 text-destructive border-destructive/30'
                            : 'border-muted hover:border-destructive/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Requests - Full Width */}
                <div className="border rounded-lg p-4">
                  <div className="font-medium mb-2">Special requests</div>
                  <p className="text-sm text-muted-foreground mb-3">Anything else we should know? (optional)</p>
                  <Textarea
                    placeholder="e.g., celebrating anniversary, need wheelchair access, traveling with a baby..."
                    className="min-h-[80px]"
                    value={editSpecialRequests}
                    onChange={(e) => setEditSpecialRequests(e.target.value)}
                  />
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Reset to saved values
                      const dna = tripDna as any;
                      setEditTravelerType(dna.travelerProfile?.partyType || 'couple');
                      setEditBudget(dna.constraints?.budget?.level || '$$');
                      setEditPace(dna.vibeAndPace?.tripPace || 'balanced');
                      setEditLodging(dna.constraints?.lodging || 'hotel');
                      setEditArea(dna.constraints?.area || 'central');
                      setEditTripTypes(dna.travelerProfile?.travelIdentities || []);
                      setEditAvoidances(dna.preferences?.avoidances?.split(', ').filter(Boolean) || []);
                      setEditSpecialRequests(dna.preferences?.specialRequests || '');
                      setExpandedSection(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePreferences}
                    disabled={isSavingPreferences}
                  >
                    {isSavingPreferences ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </TripHubSection>

            {/* Cities Section - using SwipeablePlanningView picking phase */}
            <TripHubSection
              id="section-cities"
              icon={<MapPin className="w-5 h-5" />}
              title="Cities"
              status={selectedCities.length > 0 ? `${selectedCities.length} cities selected` : `Exploring ${destinations.join(', ')}`}
              buttonText="Edit"
              onButtonClick={() => toggleSection('cities')}
              expanded={expandedSection === 'cities'}
              onToggle={() => toggleSection('cities')}
            >
              <SwipeablePlanningView
                tripDna={tripDna}
                tripId={tripId}
                itinerary={itinerary}
                items={planningItems}
                onItemsChange={setPlanningItems}
                duration={duration}
                startDate={startDate}
                endDate={endDate}
                controlledPhase="picking"
                onSearchAI={async (query, category) => {
                  if (category === 'cities') {
                    const mockItems: PlanningItem[] = [];
                    const imageFetches: Promise<{ city: string; destIdx: number; idx: number; imageUrl: string }>[] = [];

                    destinations.forEach((dest: string, destIdx: number) => {
                      const cityNames = getCitiesForDestination(dest);
                      cityNames.forEach((city, idx) => {
                        const imagePromise = fetchCityImage(city, dest).then(imageUrl => ({
                          city,
                          destIdx,
                          idx,
                          imageUrl
                        }));
                        imageFetches.push(imagePromise);
                      });
                    });

                    try {
                      const imageResults = await Promise.all(imageFetches);
                      imageResults.forEach(({ city, destIdx, idx, imageUrl }) => {
                        mockItems.push({
                          id: `city-${destIdx}-${idx}`,
                          name: city,
                          description: `Explore ${city}`,
                          imageUrl,
                          category: 'activities',
                          tags: ['cities', destinations[destIdx]],
                        });
                      });
                    } catch (error) {
                      console.error('Failed to fetch city images:', error);
                      destinations.forEach((dest: string, destIdx: number) => {
                        const cityNames = getCitiesForDestination(dest);
                        cityNames.forEach((city, idx) => {
                          mockItems.push({
                            id: `city-${destIdx}-${idx}`,
                            name: city,
                            description: `Explore ${city}`,
                            imageUrl: getCityImage(city, dest),
                            category: 'activities',
                            tags: ['cities', dest],
                          });
                        });
                      });
                    }

                    setPlanningItems(mockItems);
                  }
                }}
              />
            </TripHubSection>

            {/* Route Section - using SwipeablePlanningView */}
            <TripHubSection
              id="section-route"
              icon={<Map className="w-5 h-5" />}
              title="Route"
              status={routeOrder.length > 0 ? routeOrder.join(' → ') : 'Route not set'}
              buttonText="Edit"
              onButtonClick={() => toggleSection('route')}
              expanded={expandedSection === 'route'}
              onToggle={() => toggleSection('route')}
            >
              {selectedCities.length === 0 && routeOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Select cities first to plan your route
                </p>
              ) : (
                <SwipeablePlanningView
                  tripDna={tripDna}
                  tripId={tripId}
                  itinerary={itinerary}
                  items={planningItems}
                  onItemsChange={setPlanningItems}
                  duration={duration}
                  startDate={startDate}
                  endDate={endDate}
                  isTripLocked={false}
                  controlledPhase="route-planning"
                  onSave={() => setExpandedSection(null)}
                />
              )}
            </TripHubSection>

            {/* Itinerary Section - using SwipeablePlanningView */}
            <TripHubSection
              id="section-itinerary"
              icon={<CalendarDays className="w-5 h-5" />}
              title="Itinerary"
              status={hasDates ? `${duration} days` : 'Not started'}
              buttonText="Edit"
              onButtonClick={() => toggleSection('itinerary')}
              expanded={expandedSection === 'itinerary'}
              onToggle={() => toggleSection('itinerary')}
            >
              {!hasDates ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Please set your travel dates first
                  </p>
                </div>
              ) : (selectedCities.length === 0 && routeOrder.length === 0) ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Select cities first to generate your itinerary
                  </p>
                </div>
              ) : (
                <SwipeablePlanningView
                  tripDna={tripDna}
                  tripId={tripId}
                  itinerary={itinerary}
                  items={planningItems}
                  onItemsChange={setPlanningItems}
                  duration={duration}
                  startDate={startDate}
                  endDate={endDate}
                  isTripLocked={false}
                  controlledPhase="auto-itinerary"
                  onSave={() => setExpandedSection(null)}
                />
              )}
            </TripHubSection>

            {/* Saved Collections Section */}
            <div className="mt-6">
              <button
                onClick={() => setSavedExpanded(!savedExpanded)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-primary" />
                  <span className="font-medium">Saved for This Trip</span>
                  {savedPlaces.length > 0 && (
                    <span className="text-sm text-muted-foreground">({savedPlaces.length})</span>
                  )}
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${savedExpanded ? 'rotate-180' : ''}`} />
              </button>

              {savedExpanded && (
                <div className="mt-3 p-4 bg-muted/20 rounded-xl">
                  {savedPlaces.length === 0 ? (
                    <div className="text-center py-6">
                      <Heart className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No saved places yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Save places from Explore to see them here
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => router.push('/explore')}
                      >
                        <Compass className="w-4 h-4 mr-2" />
                        Explore Places
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Group by type */}
                      {(['attraction', 'restaurant', 'cafe', 'activity', 'nightlife'] as const).map(type => {
                        const placesOfType = savedPlaces.filter(p => p.type === type);
                        if (placesOfType.length === 0) return null;

                        const typeLabels: Record<string, string> = {
                          attraction: 'Attractions',
                          restaurant: 'Restaurants',
                          cafe: 'Cafes',
                          activity: 'Activities',
                          nightlife: 'Nightlife',
                        };

                        return (
                          <div key={type}>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              {typeLabels[type]} ({placesOfType.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {placesOfType.slice(0, 4).map(place => (
                                <div
                                  key={place.id}
                                  className="flex items-center gap-2 p-2 bg-background rounded-lg"
                                >
                                  {place.imageUrl ? (
                                    <img
                                      src={place.imageUrl}
                                      alt={place.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{place.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{place.city}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {placesOfType.length > 4 && (
                              <button className="text-xs text-primary mt-2 hover:underline">
                                +{placesOfType.length - 4} more
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-sm w-full">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Delete Trip?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This will permanently delete this trip.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overlays */}
        <TripDrawer open={drawerOpen} onOpenChange={setDrawerOpen} trips={trips} onRefresh={refreshTrips} />
        <ProfileSettings open={profileOpen} onOpenChange={setProfileOpen} />
      </div>
    );
  }

  // Full itinerary view (for trips that have generated itineraries)
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Food Recommendation Modal */}
      {foodModalDay && (
        <FoodRecommendationModal
          location={getLocationForDay(foodModalDay)}
          date={foodModalDay.date}
          dayId={foodModalDay.id}
          onClose={() => setFoodModalDay(null)}
          onAddRecommendation={handleAddFoodRecommendation}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Delete Trip?</h2>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete &quot;{itinerary.meta.title}&quot;? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Trip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Navigation Header */}
      <DashboardHeader
        activeTab="trips"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Planning / Trip View Toggle */}
      <div className="flex justify-center py-2">
        <div className="inline-flex gap-0.5 p-0.5 bg-muted rounded-full text-xs">
          <button
            onClick={() => setViewMode('planning')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewMode === 'planning'
                ? 'bg-background shadow-sm text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Plan
          </button>
          <button
            onClick={() => setViewMode('trip')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewMode === 'trip'
                ? 'bg-background shadow-sm text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Trip
          </button>
        </div>
      </div>

      {/* Planning View */}
      {viewMode === 'planning' && tripDna && (
        <div className="flex-1 overflow-auto px-4 py-4 pb-24 md:pb-4">
          <div className="max-w-2xl mx-auto">
            <SwipeablePlanningView
              tripDna={tripDna}
              tripId={tripId}
              itinerary={itinerary}
              items={planningItems}
              onItemsChange={setPlanningItems}
              duration={itinerary?.meta?.totalDays}
              isTripLocked={isTripLocked}
              onSearchAI={(query, category) => {
                // Generate mock items for the category
                const mockItems: PlanningItem[] = [];

                // Parse "Turkey → Spain" into ["Turkey", "Spain"]
                const parseDestinations = (dest: string): string[] => {
                  if (dest.includes('→')) return dest.split('→').map(d => d.trim());
                  if (dest.includes('->')) return dest.split('->').map(d => d.trim());
                  if (dest.includes(' - ')) return dest.split(' - ').map(d => d.trim());
                  return [dest];
                };
                const rawDests = tripDna.interests.destinations;
                const destinations: string[] = (rawDests && rawDests.length > 0)
                  ? rawDests
                  : parseDestinations(tripDna.interests.destination || 'destination');

                if (category === 'cities') {
                  // Generate city items for each destination
                  destinations.forEach((dest: string, destIdx: number) => {
                    const cityNames = getCitiesForDestination(dest);
                    cityNames.forEach((city, idx) => {
                      mockItems.push({
                        id: `city-${destIdx}-${idx}`,
                        name: city,
                        description: `Explore the wonders of ${city}`,
                        imageUrl: getCityImage(city, dest),
                        category: 'activities',
                        tags: ['cities', dest],
                        isFavorited: false,
                      });
                    });
                  });
                } else if (category === 'experiences') {
                  const experiences = [
                    'Walking Tour', 'Food Tour', 'Museum Visit', 'Historical Site',
                    'Local Market', 'Sunset Viewpoint', 'Cooking Class', 'Art Gallery',
                    'Nature Hike'
                  ];
                  experiences.forEach((exp, idx) => {
                    mockItems.push({
                      id: `exp-${idx}`,
                      name: exp,
                      description: `Experience the best ${exp.toLowerCase()}`,
                      imageUrl: getMockPexelsImage(exp, 'activity'),
                      category: 'activities',
                      tags: ['experiences'],
                      rating: parseFloat((4 + Math.random()).toFixed(1)),
                      priceInfo: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
                      isFavorited: false,
                    });
                  });
                } else if (category === 'hotels') {
                  const hotelTypes = ['Boutique Hotel', 'Design Hotel', 'Historic Inn', 'Modern Resort', 'Cozy B&B', 'Luxury Suite'];
                  hotelTypes.forEach((hotel, idx) => {
                    mockItems.push({
                      id: `hotel-${idx}`,
                      name: hotel,
                      description: 'Beautiful accommodations',
                      imageUrl: getMockPexelsImage(hotel, 'hotel'),
                      category: 'hotels',
                      tags: ['hotels'],
                      rating: parseFloat((4 + Math.random()).toFixed(1)),
                      priceInfo: ['$$', '$$$', '$$$$'][Math.floor(Math.random() * 3)],
                      isFavorited: false,
                    });
                  });
                } else if (category === 'restaurants') {
                  const restaurants = ['Local Bistro', 'Rooftop Bar', 'Street Food Market', 'Fine Dining', 'Seafood Restaurant', 'Traditional Tavern', 'Fusion Kitchen', 'Wine Bar', 'Cafe & Brunch'];
                  restaurants.forEach((resto, idx) => {
                    mockItems.push({
                      id: `resto-${idx}`,
                      name: resto,
                      description: 'Delicious local cuisine',
                      imageUrl: getMockPexelsImage(resto, 'restaurant'),
                      category: 'restaurants',
                      tags: ['restaurants'],
                      rating: parseFloat((4 + Math.random()).toFixed(1)),
                      priceInfo: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
                      isFavorited: false,
                    });
                  });
                } else if (category === 'cafes') {
                  const cafes = ['Artisan Coffee', 'Cozy Cafe', 'Rooftop Terrace', 'Book Cafe', 'Garden Cafe', 'Specialty Coffee'];
                  cafes.forEach((cafe, idx) => {
                    mockItems.push({
                      id: `cafe-${idx}`,
                      name: cafe,
                      description: 'Perfect spot for coffee',
                      imageUrl: getMockPexelsImage(cafe, 'cafe'),
                      category: 'cafes',
                      tags: ['cafes'],
                      rating: parseFloat((4 + Math.random()).toFixed(1)),
                      priceInfo: '$',
                      isFavorited: false,
                    });
                  });
                }

                // Merge with existing items (don't duplicate)
                const existingIds = new Set(planningItems.map(i => i.id));
                const newItems = mockItems.filter(i => !existingIds.has(i.id));
                setPlanningItems([...planningItems, ...newItems]);
              }}
            />
          </div>
        </div>
      )}

      {/* Trip View - Only show when viewMode is 'trip' */}
      {viewMode === 'trip' && (
        <>
      {/* Mobile Bottom Tab Bar (square widgets matching desktop) - hidden on tablet and up */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-10 pb-safe">
        <div className="flex justify-center items-center px-3 pt-3 pb-5 gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles, colors: PIPELINE_COLORS['Overview'] },
            { id: 'schedule', label: 'Schedule', icon: Calendar, colors: PIPELINE_COLORS['Schedule'] },
            { id: 'restaurants', label: 'Food', icon: UtensilsCrossed, colors: PIPELINE_COLORS['Food'] },
            { id: 'docs', label: 'Docs', icon: FileText, colors: PIPELINE_COLORS['Docs'] },
          ].map(({ id, label, icon: Icon, colors }) => (
            <button
              key={id}
              onClick={() => setContentFilter(id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all aspect-square flex-1 max-w-[72px] border ${
                contentFilter === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : `${colors.bg} hover:opacity-80`
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                contentFilter === id
                  ? 'bg-primary-foreground/20'
                  : colors.iconBg
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-medium text-center ${contentFilter === id ? '' : colors.text}`}>{label}</span>
            </button>
          ))}
          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all aspect-square flex-1 max-w-[72px] border ${
                  ['transport', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : `${PIPELINE_COLORS['More'].bg} hover:opacity-80`
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                  ['transport', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? 'bg-primary-foreground/20'
                    : PIPELINE_COLORS['More'].iconBg
                }`}>
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium text-center ${
                  ['transport', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? ''
                    : PIPELINE_COLORS['More'].text
                }`}>More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mb-2">
              <DropdownMenuItem onClick={() => setContentFilter('transport')}>
                <Plane className="w-4 h-4 mr-2" />
                Transport
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('hotels')}>
                <Hotel className="w-4 h-4 mr-2" />
                Hotels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('experiences')}>
                <Compass className="w-4 h-4 mr-2" />
                Activities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('packing')}>
                <Package className="w-4 h-4 mr-2" />
                Packing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('budget')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Budget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area - Fixed height, no page scroll */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 pt-1 pb-20 md:pb-1 overflow-hidden flex flex-col">
        {/* Two Column Layout: Trip Info + Pipeline Left, Itinerary Right - fills remaining space */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-1.5 items-stretch">
          {/* Left Column - Route Map (top, expanded) + Pipeline widgets (bottom, square grid) */}
          <aside className="hidden md:flex md:col-span-4 flex-col gap-1.5 min-h-0">
            {/* Map - shows all locations for overview, single location for schedule */}
            <TripRouteMap
              bases={sortedBases}
              className="flex-1 min-h-[200px]"
              singleLocation={contentFilter === 'schedule' ? (() => {
                // Get today's date or first day's location for schedule view
                const today = new Date().toISOString().split('T')[0];
                const todayDay = itinerary.days.find(d => d.date === today);
                const currentDay = todayDay || itinerary.days[0];
                return currentDay ? getLocationForDay(currentDay) : undefined;
              })() : undefined}
            />

            {/* Pipeline Card - compact square widgets at bottom */}
            <Card className="flex-shrink-0 py-0">
              <CardContent className="p-1.5">
                <div className="grid grid-cols-3 gap-2">
                  {/* Overview */}
                  <PipelineRow
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Overview"
                    countLabel={`${itinerary.days.length}/${getTotalTripDays()}`}
                    active={contentFilter === 'overview'}
                    onClick={() => setContentFilter('overview')}
                  />
                  {/* Schedule - Daily Itinerary */}
                  <PipelineRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Schedule"
                    countLabel={`${itinerary.days.length}/${getTotalTripDays()}`}
                    active={contentFilter === 'schedule'}
                    onClick={() => setContentFilter(contentFilter === 'schedule' ? 'overview' : 'schedule')}
                  />
                  {/* Transport (flights, trains, buses) */}
                  <PipelineRow
                    icon={<Plane className="w-4 h-4" />}
                    label="Transport"
                    count={itinerary.days.reduce((acc, d) => acc + d.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit').length, 0)}
                    active={contentFilter === 'transport'}
                    onClick={() => setContentFilter(contentFilter === 'transport' ? 'overview' : 'transport')}
                  />
                  {/* Hotels */}
                  <PipelineRow
                    icon={<Hotel className="w-4 h-4" />}
                    label="Hotels"
                    count={itinerary.route.bases.filter(b => b.accommodation?.name).length}
                    active={contentFilter === 'hotels'}
                    onClick={() => setContentFilter(contentFilter === 'hotels' ? 'overview' : 'hotels')}
                  />
                  {/* Food */}
                  <PipelineRow
                    icon={<UtensilsCrossed className="w-4 h-4" />}
                    label="Food"
                    count={itinerary.foodLayer?.length || 0}
                    active={contentFilter === 'restaurants'}
                    onClick={() => setContentFilter(contentFilter === 'restaurants' ? 'overview' : 'restaurants')}
                  />
                  {/* Activities */}
                  <PipelineRow
                    icon={<Compass className="w-4 h-4" />}
                    label="Activities"
                    count={itinerary.days.reduce((acc, d) => acc + d.blocks.filter(b => b.activity && !['flight', 'transit', 'food'].includes(b.activity.category)).length, 0)}
                    active={contentFilter === 'experiences'}
                    onClick={() => setContentFilter(contentFilter === 'experiences' ? 'overview' : 'experiences')}
                  />
                  {/* Packing */}
                  <PipelineRow
                    icon={<Package className="w-4 h-4" />}
                    label="Packing"
                    active={contentFilter === 'packing'}
                    onClick={() => setContentFilter(contentFilter === 'packing' ? 'overview' : 'packing')}
                  />
                  {/* Docs */}
                  <PipelineRow
                    icon={<FileText className="w-4 h-4" />}
                    label="Docs"
                    active={contentFilter === 'docs'}
                    onClick={() => setContentFilter(contentFilter === 'docs' ? 'overview' : 'docs')}
                  />
                  {/* Budget */}
                  <PipelineRow
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Budget"
                    active={contentFilter === 'budget'}
                    onClick={() => setContentFilter(contentFilter === 'budget' ? 'overview' : 'budget')}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Column - Daily Itinerary */}
          <section className="col-span-1 md:col-span-8 min-h-0 h-full overflow-hidden">
            <Card className="h-full flex flex-col py-0">
              <CardContent className="p-1.5 flex flex-col h-full overflow-hidden">
                {/* Persistent Trip Header - shows on all views */}
                <div className="flex-shrink-0 pb-2 mb-2 border-b text-center md:text-left">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="h-9 text-lg font-bold"
                        placeholder="Trip name"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-center md:justify-start">
                        <Button variant="outline" size="sm" onClick={handleSaveTitle}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <h2 className="text-lg font-bold">{itinerary.meta.title}</h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={startEditing}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {editingDestinations ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={editedDestinations}
                            onChange={(e) => setEditedDestinations(e.target.value)}
                            placeholder="Canada, Japan, Thailand..."
                            className="h-7 text-sm flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveDestinations(editedDestinations);
                              } else if (e.key === 'Escape') {
                                setEditingDestinations(false);
                              }
                            }}
                          />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSaveDestinations(editedDestinations)}>
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingDestinations(false)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <p
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => {
                            setEditedDestinations(itinerary.meta.destination);
                            setEditingDestinations(true);
                          }}
                          title="Click to edit destinations"
                        >
                          {getFlagsForDestination(itinerary.meta.destination)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Calendar Card - Shows on all views EXCEPT overview */}
                {contentFilter !== 'overview' && (
                  <div className="flex-shrink-0 mb-2">
                    {/* Mobile: collapsible, starts collapsed */}
                    <div className="md:hidden">
                      <MonthCalendar
                        trips={[{
                          id: tripId,
                          tripDna: tripDna!,
                          itinerary: itinerary,
                          createdAt: itinerary.createdAt,
                          updatedAt: itinerary.updatedAt,
                          syncedAt: new Date(),
                          status: 'active' as const,
                        }]}
                        compact
                        itinerary={itinerary}
                        contentFilter={contentFilter}
                        collapsible
                        defaultCollapsed
                        onDateClick={(date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          setTimeout(() => {
                            const dateElement = document.querySelector(`[data-date="${dateStr}"]`);
                            if (dateElement) {
                              dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else if (contentFilter === 'schedule') {
                              const dayElement = dayRefs.current[dateStr];
                              if (dayElement) {
                                dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }
                          }, 100);
                        }}
                      />
                    </div>
                    {/* Desktop: not collapsible */}
                    <div className="hidden md:block">
                      <MonthCalendar
                        trips={[{
                          id: tripId,
                          tripDna: tripDna!,
                          itinerary: itinerary,
                          createdAt: itinerary.createdAt,
                          updatedAt: itinerary.updatedAt,
                          syncedAt: new Date(),
                          status: 'active' as const,
                        }]}
                        compact
                        itinerary={itinerary}
                        contentFilter={contentFilter}
                        onDateClick={(date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          setTimeout(() => {
                            const dateElement = document.querySelector(`[data-date="${dateStr}"]`);
                            if (dateElement) {
                              dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else if (contentFilter === 'schedule') {
                              const dayElement = dayRefs.current[dateStr];
                              if (dayElement) {
                                dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }
                          }, 100);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Scrollable content area */}
                <div className="flex-1 overflow-auto min-h-0">
                  {/* Overview - Trip Summary */}
                  {contentFilter === 'overview' && (
                    <div className="space-y-3 pr-1">
                      {/* Quick Glance Schedule - uses pre-computed locationGroups */}
                      {(() => {
                        // Use the shared locationGroups (same data as map)
                        const groups = locationGroups;
                        if (groups.length === 0) return null;

                        const totalDays = groups[groups.length - 1]?.endDay || 1;

                        // Exclude origin (first) and return (last) locations from destination counts
                        // These are typically home cities, not destinations
                        const destinationGroups = groups.length > 2
                          ? groups.slice(1, -1)  // Remove first and last
                          : groups;

                        // Count unique cities (destinations only, not origin)
                        const uniqueCities = new Set(destinationGroups.map(g => g.location)).size;

                        // Count unique countries by looking at flags (destinations only)
                        const uniqueCountries = new Set(
                          destinationGroups.map(g => getFlagForLocation(g.location)).filter(f => f)
                        ).size;

                        // Format date string without timezone issues
                        const formatDateString = (dateStr: string) => {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return `${months[month - 1]} ${day}`;
                        };

                        // Get checkout date (day after endDate) for display
                        const getCheckoutDate = (endDateStr: string) => {
                          const [y, m, d] = endDateStr.split('-').map(Number);
                          const date = new Date(y, m - 1, d);
                          date.setDate(date.getDate() + 1);
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          return `${yyyy}-${mm}-${dd}`;
                        };

                        // Get date range from groups (use checkout date for end)
                        const firstDate = groups[0]?.startDate || '';
                        const lastEndDate = groups[groups.length - 1]?.endDate || '';

                        // Format the trip date range (show checkout date for the end)
                        const tripDateRange = firstDate && lastEndDate
                          ? `${formatDateString(firstDate)} – ${formatDateString(getCheckoutDate(lastEndDate))}`
                          : '';

                        // Count flights
                        const allFlights = itinerary.days.flatMap(d =>
                          d.blocks.filter(b => b.activity?.category === 'flight')
                        );
                        const totalFlights = allFlights.length;

                        return (
                          <>
                            {/* Stats Cards Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <Card className="py-0">
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold text-primary">{totalDays}</p>
                                  <p className="text-xs text-muted-foreground">days</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{tripDateRange}</p>
                                </CardContent>
                              </Card>
                              <Card className="py-0">
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold text-primary">{uniqueCountries}</p>
                                  <p className="text-xs text-muted-foreground">{uniqueCountries === 1 ? 'country' : 'countries'}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{uniqueCities} {uniqueCities === 1 ? 'city' : 'cities'}</p>
                                </CardContent>
                              </Card>
                              <Card className="py-0">
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold text-primary">{totalFlights}</p>
                                  <p className="text-xs text-muted-foreground">{totalFlights === 1 ? 'flight' : 'flights'}</p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Destinations Card */}
                            <Card className="py-0">
                              <CardContent className="p-2">
                                <div className="space-y-2">
                                  {groups.map((group, index) => {
                                    // Get days within this group's date range
                                    const daysInGroup = itinerary.days.filter(
                                      d => d.date >= group.startDate && d.date <= group.endDate
                                    );
                                    // Get transport blocks for this group
                                    const transportBlocks = daysInGroup.flatMap(d =>
                                      d.blocks.filter(b =>
                                        b.activity?.category === 'flight' || b.activity?.category === 'transit'
                                      ).map(b => ({ ...b, date: d.date }))
                                    );
                                    const isExpanded = expandedOverviewIndex === index;

                                    return (
                                      <div key={`${group.location}-${index}`}>
                                        <div
                                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group cursor-pointer hover:bg-muted/70 transition-colors"
                                          onClick={() => {
                                            if (editingOverviewIndex !== index) {
                                              setExpandedOverviewIndex(isExpanded ? null : index);
                                            }
                                          }}
                                        >
                                          {/* Day numbers */}
                                          <div className="w-16 text-xs font-medium text-primary text-center flex-shrink-0">
                                            {group.startDay === group.endDay
                                              ? `Day ${group.startDay}`
                                              : `Day ${group.startDay}-${group.endDay}`}
                                          </div>
                                          {/* Location and dates */}
                                          <div className="flex-1 min-w-0">
                                            {editingOverviewIndex === index ? (
                                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Input
                                                  value={editedLocation}
                                                  onChange={(e) => setEditedLocation(e.target.value)}
                                                  className="h-7 text-sm"
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      handleUpdateOverviewLocation(group.startDate, group.endDate, editedLocation);
                                                    } else if (e.key === 'Escape') {
                                                      setEditingOverviewIndex(null);
                                                    }
                                                  }}
                                                />
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-7 w-7"
                                                  onClick={() => handleUpdateOverviewLocation(group.startDate, group.endDate, editedLocation)}
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-7 w-7"
                                                  onClick={() => setEditingOverviewIndex(null)}
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </Button>
                                              </div>
                                            ) : (
                                              <>
                                                <p className="font-medium truncate">
                                                  {getFlagForLocation(group.location)} {group.location}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {formatDateString(group.startDate)}
                                                  {group.nights > 1 && ` – ${formatDateString(getCheckoutDate(group.endDate))}`}
                                                </p>
                                              </>
                                            )}
                                          </div>
                                          {/* Nights and actions */}
                                          {editingOverviewIndex !== index && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <span className="text-xs text-muted-foreground">
                                                {group.nights === 1 ? '1 night' : `${group.nights} nights`}
                                              </span>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingOverviewIndex(index);
                                                  setEditedLocation(group.location);
                                                }}
                                              >
                                                <Pencil className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Delete ${group.startDay === group.endDay ? 'day' : 'days'} ${group.startDay}${group.startDay !== group.endDay ? `-${group.endDay}` : ''} (${group.location})? This will remove all activities.`)) {
                                                    // Delete all days in this date range
                                                    const updatedDays = itinerary.days.filter(
                                                      d => d.date < group.startDate || d.date > group.endDate
                                                    );
                                                    // Update end date by reducing it by the number of days deleted
                                                    const daysDeleted = group.endDay - group.startDay + 1;
                                                    const currentEndDate = new Date(itinerary.meta.endDate);
                                                    currentEndDate.setDate(currentEndDate.getDate() - daysDeleted);
                                                    const newEndDate = currentEndDate.toISOString().split('T')[0];

                                                    const updatedItinerary: Itinerary = {
                                                      ...itinerary,
                                                      meta: {
                                                        ...itinerary.meta,
                                                        endDate: newEndDate,
                                                      },
                                                      days: updatedDays,
                                                      updatedAt: new Date(),
                                                    };
                                                    setItinerary(updatedItinerary);
                                                    await tripDb.updateItinerary(tripId, updatedItinerary);
                                                  }
                                                }}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                          )}
                                        </div>

                                        {/* Expanded dropdown with daily details */}
                                        {isExpanded && editingOverviewIndex !== index && (
                                          <div className="mt-2 space-y-1 pb-2 pl-3">
                                            {/* All events as flat list with date on right */}
                                            {daysInGroup.flatMap((day) =>
                                              day.blocks.filter(b => b.activity).map((block) => (
                                                <div key={block.id} className="flex items-center gap-2 text-sm">
                                                  {block.activity?.category === 'flight' && (
                                                    <Plane className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                                  )}
                                                  {block.activity?.category === 'transit' && (
                                                    <Train className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                  )}
                                                  {block.activity?.category === 'accommodation' && (
                                                    <Hotel className="w-3 h-3 text-rose-600 flex-shrink-0" />
                                                  )}
                                                  {!['flight', 'transit', 'accommodation'].includes(block.activity?.category || '') && (
                                                    <Circle className="w-2 h-2 text-muted-foreground flex-shrink-0" />
                                                  )}
                                                  <span className="text-xs flex-1 truncate">
                                                    {block.activity?.name}
                                                    {block.activity?.category === 'flight' && (block.activity?.name || '').includes('+1') && (
                                                      <span className="text-muted-foreground ml-1">(overnight)</span>
                                                    )}
                                                  </span>
                                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                    {formatDisplayDate(day.date)}
                                                  </span>
                                                </div>
                                              ))
                                            )}

                                            {daysInGroup.every(d => d.blocks.filter(b => b.activity).length === 0) && (
                                              <p className="text-xs text-muted-foreground italic">No activities planned</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Schedule - Calendar + Daily list */}
                  {(contentFilter === 'schedule' || contentFilter === 'all') && (
                    <div className="flex flex-col h-full">
                      {(() => {
                        // Generate all days in the date range (no gaps)
                        const firstDate = itinerary.days[0]?.date;
                        const lastDate = itinerary.days[itinerary.days.length - 1]?.date;
                        if (!firstDate || !lastDate) return itinerary.days.map((day) => (
                          <DayCard key={day.id} day={day} location={getLocationForDay(day)} />
                        ));

                        const [y1, m1, d1] = firstDate.split('-').map(Number);
                        const [y2, m2, d2] = lastDate.split('-').map(Number);
                        const start = new Date(y1, m1 - 1, d1);
                        const end = new Date(y2, m2 - 1, d2);
                        const today = new Date().toISOString().split('T')[0];

                        // Create a map of existing days by date
                        const daysByDate: Record<string, DayPlan> = {};
                        itinerary.days.forEach(d => { daysByDate[d.date] = d; });

                        // Generate all days
                        type DayEntry = (DayPlan & { dayNumber: number }) | { date: string; dayNumber: number; isEmpty: true };
                        const allDays: DayEntry[] = [];
                        let dayNum = 1;
                        const current = new Date(start);

                        while (current <= end) {
                          // Format as local date (not UTC) to match stored day dates
                          const yyyy = current.getFullYear();
                          const mm = String(current.getMonth() + 1).padStart(2, '0');
                          const dd = String(current.getDate()).padStart(2, '0');
                          const dateStr = `${yyyy}-${mm}-${dd}`;
                          const existingDay = daysByDate[dateStr];

                          if (existingDay) {
                            allDays.push({ ...existingDay, dayNumber: dayNum });
                          } else {
                            allDays.push({ date: dateStr, dayNumber: dayNum, isEmpty: true });
                          }

                          dayNum++;
                          current.setDate(current.getDate() + 1);
                        }

                        // Calculate schedule summary stats
                        const flightCount = itinerary.days.flatMap(d =>
                          d.blocks.filter(b => b.activity?.category === 'flight')
                        ).length;
                        const hotelCount = itinerary.route.bases.filter(b => b.accommodation?.name).length;
                        const activityCount = itinerary.days.flatMap(d =>
                          d.blocks.filter(b => b.activity?.category && !['flight', 'transit', 'food', 'checkin', 'accommodation'].includes(b.activity.category))
                        ).length;
                        const foodCount = itinerary.days.flatMap(d =>
                          d.blocks.filter(b => b.activity?.category === 'food')
                        ).length;

                        return (
                          <>
                            {/* Summary stats bar */}
                            <div className="flex items-center gap-3 text-sm pb-2 mb-2 border-b flex-wrap">
                              <span className="flex items-center gap-1 text-blue-600">
                                <Plane className="w-3.5 h-3.5" />
                                {flightCount} flight{flightCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1 text-purple-600">
                                <Hotel className="w-3.5 h-3.5" />
                                {hotelCount} hotel{hotelCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Compass className="w-3.5 h-3.5" />
                                {activityCount} activit{activityCount !== 1 ? 'ies' : 'y'}
                              </span>
                              {foodCount > 0 && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <UtensilsCrossed className="w-3.5 h-3.5" />
                                  {foodCount} meal{foodCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {/* Day list */}
                            <div ref={scheduleContainerRef} className="flex-1 overflow-auto space-y-2 pr-1">
                              {allDays.map((day) => {
                                if ('isEmpty' in day && day.isEmpty) {
                                  // Render empty day placeholder
                                  const [, month, dayOfMonth] = day.date.split('-').map(Number);
                                  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  const dateDisplay = `${shortMonths[month - 1]} ${dayOfMonth}`;

                                  return (
                                    <div
                                      key={day.date}
                                      ref={(el) => { dayRefs.current[day.date] = el; }}
                                      className="p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20"
                                    >
                                      <div className="flex items-center gap-3 text-muted-foreground">
                                        <span className="text-sm font-medium">Day {day.dayNumber}</span>
                                        <span className="text-xs">{dateDisplay}</span>
                                        <span className="text-xs ml-auto italic">No activities planned</span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={day.date}
                                    ref={(el) => { dayRefs.current[day.date] = el; }}
                                  >
                                    <DayCard
                                      day={day as DayPlan}
                                      isToday={day.date === today}
                                      isExpanded={true}
                                      onUpdateDay={handleUpdateDay}
                                      onDeleteDay={async () => {
                                        // Delete this specific day
                                        const updatedDays = itinerary.days.filter(d => d.date !== day.date);
                                        // Update end date by reducing by 1 day
                                        const currentEndDate = new Date(itinerary.meta.endDate);
                                        currentEndDate.setDate(currentEndDate.getDate() - 1);
                                        const newEndDate = currentEndDate.toISOString().split('T')[0];

                                        const updatedItinerary: Itinerary = {
                                          ...itinerary,
                                          meta: {
                                            ...itinerary.meta,
                                            endDate: newEndDate,
                                          },
                                          days: updatedDays,
                                          updatedAt: new Date(),
                                        };
                                        setItinerary(updatedItinerary);
                                        await tripDb.updateItinerary(tripId, updatedItinerary);
                                      }}
                                      location={getLocationForDay(day as DayPlan)}
                                      bases={itinerary.route.bases}
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                      onDrop={handleDrop}
                                      onDragOver={handleDragOver}
                                      isDragging={dragState.blockId !== null}
                                      dragOverIndex={dragState.targetDayId === (day as DayPlan).id ? dragState.targetIndex : null}
                                    />
                                  </div>
                                );
                              })}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
                                <GripVertical className="w-3 h-3" />
                                <span>Drag activities to reorder or move between days</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Filtered View - Transport (flights + trains/buses) */}
                  {contentFilter === 'transport' && (() => {
                    // Calculate transport stats
                    const allTransport = itinerary.days.flatMap(d =>
                      d.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit')
                    );
                    const flightCount = allTransport.filter(b => b.activity?.category === 'flight').length;
                    const transitCount = allTransport.filter(b => b.activity?.category === 'transit').length;
                    const notBooked = allTransport.filter(b => b.activity?.reservationStatus !== 'done').length;
                    const today = new Date().toISOString().split('T')[0];

                    // Filter days to only include those with transport
                    const daysWithTransport = itinerary.days
                      .filter(day => day.blocks.some(b => b.activity?.category === 'flight' || b.activity?.category === 'transit'))
                      .map(day => ({
                        ...day,
                        blocks: day.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit')
                      }));

                    return (
                    <div className="space-y-2 pr-1">
                      {/* Summary stats bar */}
                      <div className="flex items-center gap-3 text-sm pb-2 border-b">
                        {flightCount > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Plane className="w-3.5 h-3.5" />
                            {flightCount} flight{flightCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {transitCount > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Train className="w-3.5 h-3.5" />
                            {transitCount} train{transitCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {notBooked > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <span className="w-2 h-2 rounded-full border-2 border-orange-400" />
                            {notBooked} to book
                          </span>
                        )}
                        {notBooked === 0 && allTransport.length > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            All booked
                          </span>
                        )}
                      </div>
                      {/* Use DayCard with filtered blocks - same as schedule view */}
                      {daysWithTransport.map(day => (
                        <DayCard
                          key={day.id}
                          day={day}
                          isToday={day.date === today}
                          isExpanded={true}
                          onUpdateDay={handleUpdateDay}
                          location={getLocationForDay(day)}
                          bases={itinerary.route.bases}
                        />
                      ))}
                      {daysWithTransport.length === 0 && (
                        <div className="text-center py-8">
                          <Plane className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No transport in this trip</p>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Filtered View - Hotels */}
                  {contentFilter === 'hotels' && (() => {
                    // Calculate hotel stats - use optional chaining for safety
                    const bases = itinerary.route?.bases || [];
                    const hotelCount = bases.length;
                    const totalNights = bases.reduce((sum, _, idx) => sum + getActualNights(idx), 0);
                    const notBooked = bases.filter(base => {
                      const block = itinerary.days.flatMap(d => d.blocks)
                        .find(b => b.activity?.name?.toLowerCase() === base.accommodation?.name?.toLowerCase());
                      return block?.activity?.reservationStatus !== 'done';
                    }).length;
                    const today = new Date().toISOString().split('T')[0];

                    return (
                    <div className="space-y-2 pr-1">
                      {/* Summary stats bar */}
                      <div className="flex items-center gap-3 text-sm pb-2 border-b">
                        <span className="flex items-center gap-1 text-purple-600">
                          <Hotel className="w-3.5 h-3.5" />
                          {hotelCount} hotel{hotelCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-muted-foreground">
                          {totalNights} night{totalNights !== 1 ? 's' : ''}
                        </span>
                        {notBooked > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <span className="w-2 h-2 rounded-full border-2 border-orange-400" />
                            {notBooked} to book
                          </span>
                        )}
                        {notBooked === 0 && hotelCount > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            All booked
                          </span>
                        )}
                      </div>
                      {/* Hotels from route.bases - wrapped in Card like DayCard */}
                      {bases.map((base, index) => {
                        const nights = getActualNights(index);
                        const isToday = base.checkIn === today;
                        // Find accommodation block to get booking status
                        const accommodationBlock = itinerary.days
                          .flatMap(d => d.blocks)
                          .find(b => b.activity?.name?.toLowerCase() === base.accommodation?.name?.toLowerCase());
                        const isBooked = accommodationBlock?.activity?.reservationStatus === 'done';

                        return (
                          <Card key={base.id} className={isToday ? 'ring-2 ring-primary shadow-lg' : ''}>
                            <CardContent className="p-3">
                              {/* Date header - matching DayCard */}
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="text-base font-medium">{formatDisplayDate(base.checkIn)}</div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    {getFlagForLocation(base.location)} {base.location}
                                  </div>
                                </div>
                              </div>
                              {/* Hotel card - matching DayCard TimeBlockCard style */}
                              <div className="p-2 rounded-lg border bg-purple-100 text-purple-800 border-purple-200">
                                <div className="flex items-center gap-1">
                                  <span className="opacity-60 flex-shrink-0">
                                    <Hotel className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="font-medium text-sm">{base.accommodation?.name || 'Accommodation TBD'}</span>
                                  {editingHotelIndex === index ? (
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-purple-600 hover:text-purple-800"
                                        onClick={() => setEditingNights(Math.max(1, editingNights - 1))}
                                      >
                                        <span className="text-sm font-bold">−</span>
                                      </Button>
                                      <span className="text-[11px] font-medium w-4 text-center">{editingNights}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-purple-600 hover:text-purple-800"
                                        onClick={() => setEditingNights(editingNights + 1)}
                                      >
                                        <span className="text-sm font-bold">+</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-green-600 hover:text-green-800"
                                        onClick={() => handleUpdateHotelNights(index, editingNights)}
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                        onClick={() => setEditingHotelIndex(null)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      className="text-[11px] opacity-50 ml-auto flex-shrink-0 flex items-center gap-1 hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        setEditingHotelIndex(index);
                                        setEditingNights(nights);
                                      }}
                                    >
                                      {nights} night{nights > 1 ? 's' : ''}
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] opacity-70">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {base.location}
                                  </span>
                                  <span>
                                    {formatDisplayDate(base.checkIn)} - {formatDisplayDate(getCheckOutDate(base.checkIn, nights))}
                                  </span>
                                  {base.accommodation?.name && (
                                    <div className="flex items-center gap-1">
                                      {!isBooked && (
                                        <a
                                          href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(base.location)}&checkin=${base.checkIn}&checkout=${getCheckOutDate(base.checkIn, nights)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 h-4 rounded-full bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200 transition-colors"
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" />
                                          Book
                                        </a>
                                      )}
                                      <span
                                        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border-2 ${
                                          isBooked
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-transparent border-orange-400'
                                        }`}
                                      >
                                        {isBooked && <Check className="w-2.5 h-2.5" />}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {bases.length === 0 && (
                        <div className="text-center py-8">
                          <Hotel className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No hotels in this trip</p>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Filtered View - Restaurants */}
                  {contentFilter === 'restaurants' && (
                    <div className="space-y-2 pr-1">
                      <FoodLayerView foods={itinerary.foodLayer} onDeleteFood={handleDeleteFoodRecommendation} />
                    </div>
                  )}

                  {/* Filtered View - Experiences */}
                  {contentFilter === 'experiences' && (() => {
                    // Calculate experience stats - activities that are not flights, transit, food, or accommodation
                    const isExperience = (category?: string) =>
                      category && category !== 'flight' && category !== 'transit' && category !== 'food' && category !== 'checkin' && category !== 'accommodation';

                    const allExperiences = itinerary.days.flatMap(d =>
                      d.blocks.filter(b => isExperience(b.activity?.category))
                    );
                    const activityCount = allExperiences.length;
                    const notBooked = allExperiences.filter(b => b.activity?.bookingRequired && b.activity?.reservationStatus !== 'done').length;
                    const needsBooking = allExperiences.filter(b => b.activity?.bookingRequired).length;
                    const today = new Date().toISOString().split('T')[0];

                    // Filter days to only include those with experience blocks
                    const daysWithExperiences = itinerary.days
                      .filter(day => day.blocks.some(b => isExperience(b.activity?.category)))
                      .map(day => ({
                        ...day,
                        blocks: day.blocks.filter(b => isExperience(b.activity?.category))
                      }));

                    return (
                    <div className="space-y-2 pr-1">
                      {/* Summary stats bar */}
                      <div className="flex items-center gap-3 text-sm pb-2 border-b">
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Compass className="w-3.5 h-3.5" />
                          {activityCount} activit{activityCount !== 1 ? 'ies' : 'y'}
                        </span>
                        {notBooked > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <span className="w-2 h-2 rounded-full border-2 border-orange-400" />
                            {notBooked} to book
                          </span>
                        )}
                        {notBooked === 0 && needsBooking > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            All booked
                          </span>
                        )}
                      </div>
                      {/* Use DayCard with filtered blocks - same as schedule view */}
                      {daysWithExperiences.map(day => (
                        <DayCard
                          key={day.id}
                          day={day}
                          isToday={day.date === today}
                          isExpanded={true}
                          onUpdateDay={handleUpdateDay}
                          location={getLocationForDay(day)}
                          bases={itinerary.route.bases}
                        />
                      ))}
                      {daysWithExperiences.length === 0 && (
                        <div className="text-center py-8">
                          <Compass className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No experiences planned yet</p>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Packing List View */}
                  {contentFilter === 'packing' && (
                    <div className="pr-1">
                      <PackingListView packingList={itinerary.packingLayer} onRegenerate={handleRegeneratePackingList} />
                    </div>
                  )}

                  {/* Documents View */}
                  {contentFilter === 'docs' && (
                    <div className="space-y-2 pr-1">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      {/* Document categories as cards */}
                      {[
                        { icon: Stethoscope, label: 'Health Insurance', desc: 'Medical coverage abroad', color: 'bg-rose-100 text-rose-600' },
                        { icon: Shield, label: 'Travel Insurance', desc: 'Trip protection & cancellation', color: 'bg-stone-100 text-stone-600' },
                        { icon: FileText, label: 'Passport / Visa', desc: 'ID and entry documents', color: 'bg-amber-100 text-amber-600' },
                        { icon: Plane, label: 'Flight Confirmations', desc: 'Booking references & e-tickets', color: 'bg-blue-100 text-blue-600' },
                        { icon: Hotel, label: 'Hotel Reservations', desc: 'Accommodation bookings', color: 'bg-purple-100 text-purple-600' },
                        { icon: Car, label: 'Car Rental', desc: 'Vehicle bookings & licenses', color: 'bg-amber-100 text-amber-600' },
                        { icon: Ticket, label: 'Activity Tickets', desc: 'Tours, attractions & events', color: 'bg-yellow-100 text-yellow-600' },
                        { icon: CreditCard, label: 'Payment & Cards', desc: 'Credit cards & travel money', color: 'bg-stone-100 text-stone-600' },
                      ].map((doc) => {
                        const categoryDocs = getDocsForCategory(doc.label);
                        return (
                          <Card key={doc.label} className="hover:bg-muted/30 transition-colors">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.color}`}>
                                  <doc.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{doc.label}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {categoryDocs.length > 0 ? `${categoryDocs.length} file${categoryDocs.length > 1 ? 's' : ''}` : doc.desc}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => {
                                    setUploadingCategory(doc.label);
                                    fileInputRef.current?.click();
                                  }}
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Show uploaded files for this category */}
                              {categoryDocs.length > 0 && (
                                <div className="mt-3 pt-3 border-t space-y-2">
                                  {categoryDocs.map((uploadedDoc) => {
                                    const fileName = uploadedDoc.name.replace(`${doc.label}: `, '');
                                    return (
                                      <div key={uploadedDoc.id} className="flex items-center gap-2 text-xs">
                                        <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                        <span className="flex-1 truncate">{fileName}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 flex-shrink-0 hover:text-red-600"
                                          onClick={() => handleDeleteDocument(uploadedDoc.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 flex-shrink-0"
                                          onClick={() => {
                                            // Open file in new tab
                                            const url = URL.createObjectURL(uploadedDoc.data);
                                            window.open(url, '_blank');
                                          }}
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Budget View */}
                  {contentFilter === 'budget' && (
                    <div className="space-y-3 pr-1">
                      <div className="text-center py-4">
                        <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Track your travel expenses
                        </p>
                      </div>

                      {/* Budget Summary */}
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-muted-foreground">Total Budget</span>
                            {editingBudget ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm">$</span>
                                <Input
                                  type="number"
                                  value={editedBudgetValue}
                                  onChange={(e) => setEditedBudgetValue(e.target.value)}
                                  className="w-24 h-7 text-right text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const value = parseFloat(editedBudgetValue) || 0;
                                      handleSaveBudget(value);
                                      setEditingBudget(false);
                                    } else if (e.key === 'Escape') {
                                      setEditingBudget(false);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    const value = parseFloat(editedBudgetValue) || 0;
                                    handleSaveBudget(value);
                                    setEditingBudget(false);
                                  }}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditingBudget(false)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditedBudgetValue(totalBudget.toString());
                                  setEditingBudget(true);
                                }}
                                className="text-lg font-bold hover:text-primary transition-colors cursor-pointer"
                              >
                                ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-muted-foreground">Spent (Booked)</span>
                            <span className={`text-lg font-bold ${bookedExpenses.total > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              ${bookedExpenses.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Remaining</span>
                            <span className={`text-lg font-bold ${
                              totalBudget - bookedExpenses.total < 0
                                ? 'text-red-600'
                                : totalBudget - bookedExpenses.total > 0
                                  ? 'text-green-600'
                                  : 'text-muted-foreground'
                            }`}>
                              ${(totalBudget - bookedExpenses.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          {totalBudget > 0 && (
                            <div className="mt-3">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    bookedExpenses.total / totalBudget > 1
                                      ? 'bg-red-500'
                                      : bookedExpenses.total / totalBudget > 0.8
                                        ? 'bg-amber-500'
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (bookedExpenses.total / totalBudget) * 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-center">
                                {Math.round((bookedExpenses.total / totalBudget) * 100)}% of budget used
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Budget Categories - Expandable */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Booked by Category</h4>
                        <div className="space-y-2">
                          {/* Transport */}
                          <div className="rounded-lg bg-muted/50 overflow-hidden">
                            <button
                              onClick={() => setExpandedBudgetCategory(expandedBudgetCategory === 'transport' ? null : 'transport')}
                              className="flex items-center justify-between p-3 w-full hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedBudgetCategory === 'transport' ? 'rotate-0' : '-rotate-90'}`} />
                                <Plane className="w-4 h-4 text-blue-500" />
                                <span className="text-sm">Transport ({bookedExpenses.transportItems.length})</span>
                              </div>
                              <span className={`text-sm font-medium ${bookedExpenses.transport > 0 ? 'text-blue-600' : ''}`}>
                                ${bookedExpenses.transport.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </button>
                            {expandedBudgetCategory === 'transport' && bookedExpenses.transportItems.length > 0 && (
                              <div className="px-3 pb-3 space-y-2">
                                {bookedExpenses.transportItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-background text-xs">
                                    {editingBudgetItem?.blockId === item.blockId && editingBudgetItem?.dayId === item.dayId ? (
                                      <>
                                        <Input
                                          value={editedItemName}
                                          onChange={(e) => setEditedItemName(e.target.value)}
                                          className="h-6 text-xs flex-1 mr-1"
                                        />
                                        <Input
                                          type="number"
                                          value={editedItemAmount}
                                          onChange={(e) => setEditedItemAmount(e.target.value)}
                                          className="h-6 text-xs w-20 mr-1"
                                        />
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                          handleUpdateBudgetItem(item.dayId, item.blockId, editedItemName, parseFloat(editedItemAmount) || 0);
                                        }}><Check className="w-3 h-3" /></Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingBudgetItem(null)}><X className="w-3 h-3" /></Button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="truncate flex-1" title={item.name}>{item.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                                          {item.blockId && (
                                            <>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => {
                                                setEditingBudgetItem({ blockId: item.blockId, dayId: item.dayId });
                                                setEditedItemName(item.name);
                                                setEditedItemAmount(item.amount.toString());
                                              }}><Pencil className="w-2.5 h-2.5" /></Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" onClick={() => handleDeleteBudgetItem(item.dayId, item.blockId)}><Trash2 className="w-2.5 h-2.5" /></Button>
                                            </>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Accommodation */}
                          <div className="rounded-lg bg-muted/50 overflow-hidden">
                            <button
                              onClick={() => setExpandedBudgetCategory(expandedBudgetCategory === 'accommodation' ? null : 'accommodation')}
                              className="flex items-center justify-between p-3 w-full hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedBudgetCategory === 'accommodation' ? 'rotate-0' : '-rotate-90'}`} />
                                <Hotel className="w-4 h-4 text-purple-500" />
                                <span className="text-sm">Accommodation ({bookedExpenses.accommodationItems.length})</span>
                              </div>
                              <span className={`text-sm font-medium ${bookedExpenses.accommodation > 0 ? 'text-purple-600' : ''}`}>
                                ${bookedExpenses.accommodation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </button>
                            {expandedBudgetCategory === 'accommodation' && bookedExpenses.accommodationItems.length > 0 && (
                              <div className="px-3 pb-3 space-y-2">
                                {bookedExpenses.accommodationItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-background text-xs">
                                    {editingBudgetItem?.blockId === item.blockId && editingBudgetItem?.dayId === item.dayId ? (
                                      <>
                                        <Input
                                          value={editedItemName}
                                          onChange={(e) => setEditedItemName(e.target.value)}
                                          className="h-6 text-xs flex-1 mr-1"
                                        />
                                        <Input
                                          type="number"
                                          value={editedItemAmount}
                                          onChange={(e) => setEditedItemAmount(e.target.value)}
                                          className="h-6 text-xs w-20 mr-1"
                                        />
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                          handleUpdateBudgetItem(item.dayId, item.blockId, editedItemName, parseFloat(editedItemAmount) || 0);
                                        }}><Check className="w-3 h-3" /></Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingBudgetItem(null)}><X className="w-3 h-3" /></Button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="truncate flex-1" title={item.name}>{item.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => {
                                            setEditingBudgetItem({ blockId: item.blockId, dayId: item.dayId });
                                            setEditedItemName(item.name);
                                            setEditedItemAmount(item.amount.toString());
                                          }}><Pencil className="w-2.5 h-2.5" /></Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" onClick={() => handleDeleteBudgetItem(item.dayId, item.blockId)}><Trash2 className="w-2.5 h-2.5" /></Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Food & Dining */}
                          <div className="rounded-lg bg-muted/50 overflow-hidden">
                            <button
                              onClick={() => setExpandedBudgetCategory(expandedBudgetCategory === 'food' ? null : 'food')}
                              className="flex items-center justify-between p-3 w-full hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedBudgetCategory === 'food' ? 'rotate-0' : '-rotate-90'}`} />
                                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                                <span className="text-sm">Food & Dining ({bookedExpenses.foodItems.length})</span>
                              </div>
                              <span className={`text-sm font-medium ${bookedExpenses.food > 0 ? 'text-orange-600' : ''}`}>
                                ${bookedExpenses.food.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </button>
                            {expandedBudgetCategory === 'food' && bookedExpenses.foodItems.length > 0 && (
                              <div className="px-3 pb-3 space-y-2">
                                {bookedExpenses.foodItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-background text-xs">
                                    {editingBudgetItem?.blockId === item.blockId && editingBudgetItem?.dayId === item.dayId ? (
                                      <>
                                        <Input
                                          value={editedItemName}
                                          onChange={(e) => setEditedItemName(e.target.value)}
                                          className="h-6 text-xs flex-1 mr-1"
                                        />
                                        <Input
                                          type="number"
                                          value={editedItemAmount}
                                          onChange={(e) => setEditedItemAmount(e.target.value)}
                                          className="h-6 text-xs w-20 mr-1"
                                        />
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                          handleUpdateBudgetItem(item.dayId, item.blockId, editedItemName, parseFloat(editedItemAmount) || 0);
                                        }}><Check className="w-3 h-3" /></Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingBudgetItem(null)}><X className="w-3 h-3" /></Button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="truncate flex-1" title={item.name}>{item.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => {
                                            setEditingBudgetItem({ blockId: item.blockId, dayId: item.dayId });
                                            setEditedItemName(item.name);
                                            setEditedItemAmount(item.amount.toString());
                                          }}><Pencil className="w-2.5 h-2.5" /></Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" onClick={() => handleDeleteBudgetItem(item.dayId, item.blockId)}><Trash2 className="w-2.5 h-2.5" /></Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Activities */}
                          <div className="rounded-lg bg-muted/50 overflow-hidden">
                            <button
                              onClick={() => setExpandedBudgetCategory(expandedBudgetCategory === 'activities' ? null : 'activities')}
                              className="flex items-center justify-between p-3 w-full hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedBudgetCategory === 'activities' ? 'rotate-0' : '-rotate-90'}`} />
                                <Compass className="w-4 h-4 text-amber-500" />
                                <span className="text-sm">Activities ({bookedExpenses.activityItems.length})</span>
                              </div>
                              <span className={`text-sm font-medium ${bookedExpenses.activities > 0 ? 'text-amber-600' : ''}`}>
                                ${bookedExpenses.activities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </button>
                            {expandedBudgetCategory === 'activities' && bookedExpenses.activityItems.length > 0 && (
                              <div className="px-3 pb-3 space-y-2">
                                {bookedExpenses.activityItems.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-background text-xs">
                                    {editingBudgetItem?.blockId === item.blockId && editingBudgetItem?.dayId === item.dayId ? (
                                      <>
                                        <Input
                                          value={editedItemName}
                                          onChange={(e) => setEditedItemName(e.target.value)}
                                          className="h-6 text-xs flex-1 mr-1"
                                        />
                                        <Input
                                          type="number"
                                          value={editedItemAmount}
                                          onChange={(e) => setEditedItemAmount(e.target.value)}
                                          className="h-6 text-xs w-20 mr-1"
                                        />
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                          handleUpdateBudgetItem(item.dayId, item.blockId, editedItemName, parseFloat(editedItemAmount) || 0);
                                        }}><Check className="w-3 h-3" /></Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingBudgetItem(null)}><X className="w-3 h-3" /></Button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="truncate flex-1" title={item.name}>{item.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="font-medium">${item.amount.toLocaleString()}</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => {
                                            setEditingBudgetItem({ blockId: item.blockId, dayId: item.dayId });
                                            setEditedItemName(item.name);
                                            setEditedItemAmount(item.amount.toString());
                                          }}><Pencil className="w-2.5 h-2.5" /></Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500" onClick={() => handleDeleteBudgetItem(item.dayId, item.blockId)}><Trash2 className="w-2.5 h-2.5" /></Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {bookedExpenses.total === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Mark items as booked to track spending
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
        </>
      )}

      {/* Overlays - always visible */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
        onRefresh={refreshTrips}
      />

      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

    </div>
  );
}

// Pipeline Row Component (vertical sidebar layout)
interface PipelineRowProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  countLabel?: string; // For custom labels like "41/50"
  active?: boolean;
  onClick: () => void;
}

// Active state colors matching category colors
const ACTIVE_COLORS: Record<string, { bg: string; iconBg: string; text: string }> = {
  'Overview': { bg: 'bg-red-500 border-red-600', iconBg: 'bg-red-400/30', text: 'text-white' },
  'Schedule': { bg: 'bg-red-500 border-red-600', iconBg: 'bg-red-400/30', text: 'text-white' },
  'Transport': { bg: 'bg-blue-500 border-blue-600', iconBg: 'bg-blue-400/30', text: 'text-white' },
  'Hotels': { bg: 'bg-purple-500 border-purple-600', iconBg: 'bg-purple-400/30', text: 'text-white' },
  'Food': { bg: 'bg-orange-500 border-orange-600', iconBg: 'bg-orange-400/30', text: 'text-white' },
  'Activities': { bg: 'bg-yellow-500 border-yellow-600', iconBg: 'bg-yellow-400/30', text: 'text-white' },
  'Packing': { bg: 'bg-amber-500 border-amber-600', iconBg: 'bg-amber-400/30', text: 'text-white' },
  'Docs': { bg: 'bg-lime-500 border-lime-600', iconBg: 'bg-lime-400/30', text: 'text-white' },
  'Budget': { bg: 'bg-indigo-500 border-indigo-600', iconBg: 'bg-indigo-400/30', text: 'text-white' },
};

function PipelineRow({ icon, label, count, countLabel, active, onClick }: PipelineRowProps) {
  const colors = PIPELINE_COLORS[label] || { bg: 'bg-muted/50 border-transparent', iconBg: 'bg-muted text-muted-foreground', text: '' };
  const activeColors = ACTIVE_COLORS[label] || { bg: 'bg-primary border-primary', iconBg: 'bg-primary-foreground/20', text: 'text-white' };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all aspect-square border ${
        active
          ? activeColors.bg
          : `${colors.bg} hover:opacity-80`
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
        active
          ? activeColors.iconBg
          : colors.iconBg
      }`}>
        {icon}
      </div>
      <span className={`text-xs font-medium text-center ${active ? activeColors.text : colors.text}`}>{label}</span>
      {(count !== undefined || countLabel) && (
        <p className={`text-[10px] text-center ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
          {countLabel || count}
        </p>
      )}
    </button>
  );
}
