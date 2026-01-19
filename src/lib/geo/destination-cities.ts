/**
 * Popular tourist cities for destinations
 * Used for "Pick Your Cities" feature - shows cities within a country/region
 */

export const DESTINATION_CITIES: Record<string, string[]> = {
  // Asia
  'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui', 'Ayutthaya', 'Pai', 'Chiang Rai', 'Koh Phi Phi', 'Koh Lanta', 'Koh Tao', 'Hua Hin', 'Koh Chang', 'Sukhothai', 'Kanchanaburi'],
  'Japan': ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Hakone', 'Kanazawa', 'Nikko', 'Fukuoka', 'Takayama', 'Nagoya', 'Kamakura', 'Naoshima', 'Kobe', 'Miyajima'],
  'Vietnam': ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hoi An', 'Hue', 'Nha Trang', 'Sapa', 'Ha Long Bay', 'Phu Quoc', 'Ninh Binh', 'Dalat', 'Mui Ne', 'Can Tho'],
  'Indonesia': ['Bali', 'Jakarta', 'Yogyakarta', 'Lombok', 'Komodo', 'Raja Ampat', 'Bandung', 'Gili Islands', 'Labuan Bajo', 'Flores'],
  'Bali': ['Ubud', 'Seminyak', 'Canggu', 'Uluwatu', 'Sanur', 'Nusa Penida', 'Kuta', 'Amed', 'Lovina', 'Munduk', 'Sidemen', 'Jimbaran'],
  'South Korea': ['Seoul', 'Busan', 'Jeju Island', 'Gyeongju', 'Incheon', 'Jeonju', 'Suwon', 'Gangneung'],
  'China': ['Beijing', 'Shanghai', 'Hong Kong', "Xi'an", 'Guilin', 'Chengdu', 'Hangzhou', 'Suzhou', 'Zhangjiajie'],
  'India': ['Delhi', 'Mumbai', 'Jaipur', 'Agra', 'Varanasi', 'Kerala', 'Goa', 'Udaipur', 'Rishikesh'],
  'Singapore': ['Marina Bay', 'Sentosa', 'Chinatown', 'Little India', 'Orchard Road', 'Clarke Quay'],
  'Malaysia': ['Kuala Lumpur', 'Penang', 'Langkawi', 'Malacca', 'Cameron Highlands', 'Borneo', 'Ipoh', 'Kota Kinabalu'],
  'Philippines': ['Manila', 'Palawan', 'Boracay', 'Cebu', 'Siargao', 'Bohol', 'Baguio', 'Coron'],

  // Europe
  'Italy': ['Rome', 'Florence', 'Venice', 'Milan', 'Amalfi Coast', 'Cinque Terre', 'Naples', 'Tuscany', 'Bologna', 'Verona', 'Lake Como', 'Siena', 'Pisa', 'Sorrento'],
  'France': ['Paris', 'Nice', 'Lyon', 'Bordeaux', 'Marseille', 'Provence', 'Strasbourg', 'Mont Saint-Michel', 'Cannes', 'Avignon', 'Annecy', 'Colmar'],
  'Spain': ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada', 'San Sebastian', 'Bilbao', 'Malaga', 'Toledo', 'Ibiza', 'Ronda', 'Salamanca'],
  'Portugal': ['Lisbon', 'Porto', 'Sintra', 'Algarve', 'Madeira', 'Coimbra', 'Cascais', 'Lagos', 'Azores'],
  'Greece': ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu', 'Meteora', 'Delphi', 'Thessaloniki', 'Naxos', 'Paros'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Dresden', 'Heidelberg', 'Rothenburg', 'Nuremberg', 'Bamberg'],
  'UK': ['London', 'Edinburgh', 'Bath', 'Oxford', 'Cambridge', 'York', 'Liverpool', 'Manchester', 'Brighton', 'Bristol', 'Cornwall'],
  'England': ['London', 'Bath', 'Oxford', 'Cambridge', 'York', 'Liverpool', 'Manchester', 'Brighton', 'Bristol', 'Cornwall', 'Cotswolds'],
  'Scotland': ['Edinburgh', 'Glasgow', 'Isle of Skye', 'Inverness', 'St Andrews', 'Highlands', 'Glencoe', 'Loch Ness'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Delft', 'Leiden', 'Haarlem', 'Maastricht'],
  'Switzerland': ['Zurich', 'Lucerne', 'Interlaken', 'Zermatt', 'Geneva', 'Bern', 'Basel', 'Lausanne', 'Grindelwald', 'Lugano'],
  'Austria': ['Vienna', 'Salzburg', 'Innsbruck', 'Hallstatt', 'Graz', 'Linz'],
  'Czech Republic': ['Prague', 'Cesky Krumlov', 'Brno', 'Karlovy Vary'],
  'Croatia': ['Dubrovnik', 'Split', 'Zagreb', 'Plitvice Lakes', 'Hvar', 'Rovinj', 'Zadar'],
  'Turkey': ['Istanbul', 'Cappadocia', 'Antalya', 'Bodrum', 'Ephesus', 'Pamukkale', 'Izmir', 'Ankara', 'Fethiye'],
  'Iceland': ['Reykjavik', 'Blue Lagoon', 'Golden Circle', 'Vik', 'Akureyri', 'Jokulsarlon'],
  'Norway': ['Oslo', 'Bergen', 'Tromso', 'Lofoten Islands', 'Stavanger', 'Geirangerfjord'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmo', 'Uppsala', 'Lapland'],
  'Denmark': ['Copenhagen', 'Aarhus', 'Odense'],
  'Ireland': ['Dublin', 'Galway', 'Cork', 'Ring of Kerry', 'Cliffs of Moher', 'Killarney'],
  'Belgium': ['Brussels', 'Bruges', 'Ghent', 'Antwerp'],
  'Poland': ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw'],
  'Hungary': ['Budapest', 'Eger'],

  // Americas
  'USA': ['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Miami', 'Las Vegas', 'Seattle', 'Boston', 'New Orleans', 'Washington DC', 'San Diego', 'Austin', 'Nashville'],
  'Hawaii': ['Honolulu', 'Maui', 'Kauai', 'Big Island', 'Waikiki', 'Oahu', 'North Shore', 'Kona', 'Hilo', 'Lahaina'],
  'Mexico': ['Mexico City', 'Cancun', 'Tulum', 'Oaxaca', 'Playa del Carmen', 'San Miguel de Allende', 'Guanajuato', 'Puerto Vallarta'],
  'Peru': ['Lima', 'Cusco', 'Machu Picchu', 'Arequipa', 'Sacred Valley', 'Lake Titicaca'],
  'Argentina': ['Buenos Aires', 'Mendoza', 'Patagonia', 'Iguazu Falls', 'Bariloche', 'Ushuaia'],
  'Brazil': ['Rio de Janeiro', 'Sao Paulo', 'Salvador', 'Florianopolis', 'Iguazu Falls', 'Fernando de Noronha'],
  'Colombia': ['Bogota', 'Medellin', 'Cartagena', 'Santa Marta', 'Tayrona'],
  'Costa Rica': ['San Jose', 'Arenal', 'Manuel Antonio', 'Monteverde', 'Tamarindo'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Banff', 'Quebec City', 'Niagara Falls', 'Ottawa', 'Victoria', 'Whistler'],

  // Middle East & Africa
  'Morocco': ['Marrakech', 'Fes', 'Chefchaouen', 'Casablanca', 'Essaouira', 'Sahara Desert'],
  'Egypt': ['Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Giza', 'Hurghada', 'Sharm El Sheikh'],
  'Israel': ['Tel Aviv', 'Jerusalem', 'Haifa', 'Dead Sea', 'Eilat'],
  'Jordan': ['Amman', 'Petra', 'Wadi Rum', 'Dead Sea', 'Aqaba'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'Dubai': ['Downtown Dubai', 'Palm Jumeirah', 'Dubai Marina', 'Old Dubai', 'Jumeirah Beach'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Kruger National Park', 'Durban', 'Garden Route'],
  'Kenya': ['Nairobi', 'Masai Mara', 'Mombasa', 'Amboseli'],
  'Tanzania': ['Serengeti', 'Zanzibar', 'Kilimanjaro', 'Ngorongoro', 'Arusha'],

  // Oceania
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Great Barrier Reef', 'Uluru', 'Gold Coast', 'Cairns', 'Byron Bay'],
  'New Zealand': ['Auckland', 'Queenstown', 'Wellington', 'Rotorua', 'Milford Sound', 'Christchurch', 'Hobbiton'],
};

/**
 * Get cities for a destination (country or region)
 * Returns city names for the given destination
 */
export function getCitiesForDestination(destination: string): string[] {
  const normalizedDest = destination.toLowerCase().trim();
  
  // Direct match
  for (const [key, cities] of Object.entries(DESTINATION_CITIES)) {
    if (key.toLowerCase() === normalizedDest) {
      return cities;
    }
  }
  
  // Partial match
  for (const [key, cities] of Object.entries(DESTINATION_CITIES)) {
    if (normalizedDest.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedDest)) {
      return cities;
    }
  }
  
  // No match - return destination as a single city
  return [destination];
}
