import Anthropic from '@anthropic-ai/sdk';

export interface CityHighlight {
  name: string;
  description: string;
}

export interface CityInfo {
  bestFor: string[];
  crowdLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  bestTime: string;
  topSites: string[];
  localTip: string;
  avgDays: string;
  pros: string[];
  cons: string[];
  // Categorized highlights - detailed "reasons to visit"
  highlights?: {
    landmarks?: CityHighlight[];
    history?: CityHighlight[];
    museums?: CityHighlight[];
    markets?: CityHighlight[];
    food?: CityHighlight[];
    nature?: CityHighlight[];
  };
  // Who is this city best for?
  idealFor?: string[];
}

// Cache for generated city info to avoid repeated API calls
const cityInfoCache = new Map<string, CityInfo>();

// Generate city info using Claude AI
export async function generateCityInfo(cityName: string, country?: string): Promise<CityInfo> {
  // Check cache first
  const cacheKey = `${cityName}-${country || ''}`;
  if (cityInfoCache.has(cacheKey)) {
    return cityInfoCache.get(cacheKey)!;
  }

  const client = new Anthropic();

  const prompt = `Generate detailed travel information for ${cityName}${country ? `, ${country}` : ''}.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "bestFor": ["3-4 categories like History, Beach, Food, Nature, Nightlife, Art, Adventure, Culture, Shopping, Romance"],
  "crowdLevel": "Low" | "Moderate" | "High" | "Very High",
  "bestTime": "Best months to visit, e.g., 'Apr-Jun, Sep-Oct'",
  "topSites": ["4 specific famous landmarks/attractions in this city - use actual names like 'Hagia Sophia', not generic like 'Local landmarks'"],
  "localTip": "One specific insider tip that locals would know",
  "avgDays": "Recommended days to spend, e.g., '2-3 days'",
  "pros": ["3 specific positive things about visiting this city"],
  "cons": ["3 specific drawbacks or challenges"]
}

Be specific to ${cityName}. Use real landmark names, actual best seasons, and genuine local insights.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Parse the JSON response
      const cityInfo = JSON.parse(content.text) as CityInfo;

      // Cache the result
      cityInfoCache.set(cacheKey, cityInfo);

      return cityInfo;
    }
  } catch (error) {
    console.error('Error generating city info:', error);
  }

  // Fallback default
  return {
    bestFor: ['Exploration'],
    crowdLevel: 'Moderate',
    bestTime: 'Spring or Fall',
    topSites: ['City Center', 'Main Square', 'Local Museum', 'Historic District'],
    localTip: 'Ask locals for their favorite hidden spots',
    avgDays: '2-3 days',
    pros: ['Unique local culture', 'Authentic experiences', 'Off the beaten path'],
    cons: ['May require more planning', 'Limited tourist infrastructure', 'Language barriers possible'],
  };
}

// Pre-populated data for popular cities (faster than API calls)
export const POPULAR_CITY_INFO: Record<string, CityInfo> = {
  // Turkey
  'Istanbul': {
    bestFor: ['History', 'Culture', 'Food'],
    crowdLevel: 'High',
    bestTime: 'Apr-May, Sep-Oct',
    topSites: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar', 'Topkapi Palace'],
    localTip: 'Take a Bosphorus ferry at sunset for stunning views',
    avgDays: '3-4 days',
    pros: ['Incredible history spanning millennia', 'Amazing food scene', 'Great value for money'],
    cons: ['Can be overwhelming for first-timers', 'Traffic congestion', 'Persistent street vendors'],
    idealFor: ['History enthusiasts', 'Foodies', 'Culture lovers', 'Architecture fans', 'Shoppers'],
    highlights: {
      landmarks: [
        { name: 'Hagia Sophia', description: 'Architectural marvel built in 537 AD - served as church, mosque, museum, and now mosque again' },
        { name: 'Blue Mosque (Sultan Ahmed)', description: 'Iconic 17th-century mosque famous for its six minarets and 20,000+ blue İznik tiles' },
        { name: 'Galata Tower', description: 'Medieval stone tower offering 360° panoramic views of the city and Bosphorus' },
        { name: 'Bosphorus Strait', description: 'The waterway dividing Europe and Asia - take a ferry cruise to see palaces and wooden mansions' },
      ],
      history: [
        { name: 'Byzantine Constantinople', description: 'Capital of the Eastern Roman Empire for over 1,000 years (330-1453 AD)' },
        { name: 'Ottoman Empire Capital', description: 'Heart of the Ottoman Empire for nearly 500 years until 1923' },
        { name: 'Crossroads of Civilizations', description: 'The only city spanning two continents, connecting East and West for millennia' },
      ],
      museums: [
        { name: 'Topkapi Palace Museum', description: 'Ottoman sultans\' residence with imperial treasures, harem quarters, and holy relics' },
        { name: 'Istanbul Archaeological Museums', description: 'Three museums with artifacts spanning 5,000 years including the Alexander Sarcophagus' },
        { name: 'Basilica Cistern', description: 'Underground water reservoir from 532 AD with 336 columns and atmospheric lighting' },
      ],
      markets: [
        { name: 'Grand Bazaar', description: 'One of the world\'s oldest and largest covered markets with 4,000+ shops since 1461' },
        { name: 'Spice Bazaar (Egyptian Bazaar)', description: 'Fragrant market with spices, Turkish delight, dried fruits, and teas' },
        { name: 'Kadıköy Market', description: 'Authentic local market on the Asian side - less touristy with great street food' },
      ],
      food: [
        { name: 'Turkish Breakfast', description: 'Lavish spreads with cheeses, olives, tomatoes, eggs, simit, and çay (tea)' },
        { name: 'Döner & Kebabs', description: 'From street-side döner to fine-dining kebabs - meat is done to perfection here' },
        { name: 'Baklava & Turkish Delight', description: 'Sweet treats perfected over centuries - try Karaköy Güllüoğlu for authentic baklava' },
      ],
    }
  },
  'Cappadocia': { bestFor: ['Nature', 'Adventure', 'Photography'], crowdLevel: 'Moderate', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Hot Air Balloon Rides', 'Göreme Open Air Museum', 'Underground Cities', 'Fairy Chimneys'], localTip: 'Book balloon rides weeks in advance for sunrise flights', avgDays: '2-3 days', pros: ['Otherworldly landscapes', 'Unique cave hotels', 'Bucket-list balloon rides'], cons: ['Balloon flights often cancelled due to weather', 'Limited nightlife', 'Remote location'] },
  'Antalya': { bestFor: ['Beach', 'History', 'Relaxation'], crowdLevel: 'Moderate', bestTime: 'May-Jun, Sep-Oct', topSites: ['Kaleiçi Old Town', 'Düden Waterfalls', 'Aspendos Theater', 'Konyaaltı Beach'], localTip: 'Visit Perge and Aspendos ancient ruins nearby', avgDays: '2-3 days', pros: ['Beautiful beaches', 'Ancient ruins nearby', 'Good weather most of year'], cons: ['Very touristy in summer', 'Resort-heavy areas', 'Can feel commercialized'] },
  'Bodrum': { bestFor: ['Beach', 'Nightlife', 'Sailing'], crowdLevel: 'High', bestTime: 'Jun-Sep', topSites: ['Bodrum Castle', 'Mausoleum of Halicarnassus', 'Bodrum Marina', 'Gümbet Beach'], localTip: 'Take a blue cruise on a traditional gulet to explore hidden coves', avgDays: '2-3 days', pros: ['Turkish Riviera vibes', 'Great sailing scene', 'Vibrant nightlife'], cons: ['Very crowded in summer', 'Expensive for Turkey', 'Party-focused atmosphere'] },
  'Trabzon': { bestFor: ['Nature', 'History', 'Culture'], crowdLevel: 'Low', bestTime: 'May-Sep', topSites: ['Sumela Monastery', 'Uzungöl Lake', 'Trabzon Hagia Sophia', 'Boztepe Hill'], localTip: 'Drive the scenic highland road to Ayder Plateau for lush green meadows', avgDays: '2-3 days', pros: ['Spectacular mountain scenery', 'Unique Black Sea culture', 'Uncrowded and authentic'], cons: ['Far from other tourist areas', 'Rainy weather possible', 'Limited English spoken'] },
  'Konya': { bestFor: ['Spirituality', 'History', 'Culture'], crowdLevel: 'Low', bestTime: 'Dec (Whirling Dervishes), Apr-Jun', topSites: ['Mevlana Museum', 'Alaeddin Mosque', 'Karatay Medrese', 'Sille Village'], localTip: 'Visit during December for Whirling Dervishes Sema ceremonies', avgDays: '1-2 days', pros: ['Spiritual home of Rumi', 'Rich Seljuk architecture', 'Authentic Turkish experience'], cons: ['Conservative dress expected', 'Very hot in summer', 'Limited tourist amenities'] },
  // Spain
  'Barcelona': { bestFor: ['Architecture', 'Beach', 'Nightlife'], crowdLevel: 'Very High', bestTime: 'May-Jun, Sep-Oct', topSites: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Gothic Quarter'], localTip: 'Book Sagrada Familia tickets online weeks ahead', avgDays: '3-4 days', pros: ['Unique Gaudí architecture', 'Beach and city combined', 'Vibrant nightlife'], cons: ['Extremely crowded', 'Pickpockets on La Rambla', 'Overtourism concerns'] },
  'Madrid': { bestFor: ['Art', 'Food', 'Nightlife'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['Prado Museum', 'Royal Palace', 'Retiro Park', 'Plaza Mayor'], localTip: 'Dinner starts at 9-10pm - embrace the late Spanish schedule', avgDays: '2-3 days', pros: ['World-class art museums', 'Fantastic food scene', 'Less touristy than Barcelona'], cons: ['Hot summers', 'Late schedule takes adjustment', 'No beach'] },
  // Italy
  'Rome': {
    bestFor: ['History', 'Art', 'Food'],
    crowdLevel: 'Very High',
    bestTime: 'Apr-May, Sep-Oct',
    topSites: ['Colosseum', 'Vatican Museums', 'Trevi Fountain', 'Roman Forum'],
    localTip: 'Book skip-the-line tickets for Vatican and Colosseum',
    avgDays: '3-4 days',
    pros: ['2,500+ years of history', 'Incredible food everywhere', 'Art at every corner'],
    cons: ['Overwhelming crowds', 'Tourist traps near attractions', 'Hot and chaotic in summer'],
    idealFor: ['History buffs', 'Art lovers', 'Foodies', 'Architecture enthusiasts', 'Religious pilgrims'],
    highlights: {
      landmarks: [
        { name: 'Colosseum', description: 'Iconic 50,000-seat amphitheater from 80 AD where gladiators fought - symbol of Imperial Rome' },
        { name: 'Pantheon', description: 'Best-preserved ancient Roman building with the world\'s largest unreinforced concrete dome (125 AD)' },
        { name: 'Trevi Fountain', description: 'Baroque masterpiece where tossing a coin ensures your return to Rome' },
        { name: 'Roman Forum', description: 'The heart of ancient Rome - walk where emperors, senators, and citizens once gathered' },
      ],
      history: [
        { name: 'Ancient Rome (753 BC - 476 AD)', description: 'Capital of one of history\'s greatest empires, whose ruins still dominate the city' },
        { name: 'Center of Christianity', description: 'Home of the Catholic Church and the Pope for nearly 2,000 years' },
        { name: 'Renaissance Rome', description: 'Patronage by popes created masterpieces by Michelangelo, Raphael, and Bernini' },
      ],
      museums: [
        { name: 'Vatican Museums', description: 'One of the world\'s greatest art collections culminating in the Sistine Chapel ceiling' },
        { name: 'Borghese Gallery', description: 'Exquisite collection of Bernini sculptures and Caravaggio paintings in a villa setting' },
        { name: 'Capitoline Museums', description: 'The world\'s oldest public museum with iconic Roman sculptures like the She-Wolf' },
      ],
      markets: [
        { name: 'Campo de\' Fiori', description: 'Daily open-air market with fresh produce, flowers, and local goods since 1869' },
        { name: 'Testaccio Market', description: 'Authentic local market with Rome\'s best street food - try the supplì (fried rice balls)' },
        { name: 'Porta Portese', description: 'Massive Sunday flea market with antiques, vintage items, and everything imaginable' },
      ],
      food: [
        { name: 'Cacio e Pepe', description: 'Simple Roman pasta perfection with pecorino cheese and black pepper' },
        { name: 'Carbonara', description: 'The authentic version uses guanciale (cured pork jowl), egg, and pecorino - no cream!' },
        { name: 'Supplì & Pizza al Taglio', description: 'Roman street food essentials - fried rice balls and pizza by weight' },
      ],
    }
  },
  'Florence': { bestFor: ['Art', 'Architecture', 'Food'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Uffizi Gallery', 'Duomo', 'Ponte Vecchio', 'Accademia'], localTip: 'Climb the Duomo dome at sunset for magical views', avgDays: '2-3 days', pros: ['Renaissance art capital', 'Walkable historic center', 'Tuscan food and wine'], cons: ['Very crowded', 'Expensive near center', 'Can feel like a museum'] },
  'Venice': { bestFor: ['Romance', 'Art', 'Architecture'], crowdLevel: 'Very High', bestTime: 'Mar-May, Sep-Nov', topSites: ['St. Mark\'s Basilica', 'Grand Canal', 'Rialto Bridge', 'Doge\'s Palace'], localTip: 'Get lost in Dorsoduro for authentic local experience', avgDays: '2-3 days', pros: ['Truly unique city', 'Romantic atmosphere', 'No cars'], cons: ['Extremely crowded', 'Very expensive', 'Flooding risk'] },
  // Japan
  'Tokyo': { bestFor: ['Culture', 'Food', 'Technology'], crowdLevel: 'High', bestTime: 'Mar-May, Sep-Nov', topSites: ['Senso-ji Temple', 'Shibuya Crossing', 'Meiji Shrine', 'Tsukiji Market'], localTip: 'Get a Suica card for seamless train travel', avgDays: '4-5 days', pros: ['Incredible food scene', 'Perfect blend of old and new', 'Extremely safe'], cons: ['Language barrier', 'Can be overwhelming', 'Expensive accommodations'] },
  'Kyoto': {
    bestFor: ['History', 'Culture', 'Nature'],
    crowdLevel: 'High',
    bestTime: 'Mar-May, Oct-Nov',
    topSites: ['Fushimi Inari Shrine', 'Kinkaku-ji', 'Arashiyama Bamboo Grove', 'Gion District'],
    localTip: 'Visit Fushimi Inari at dawn to avoid crowds',
    avgDays: '3-4 days',
    pros: ['Ancient temples and shrines', 'Beautiful gardens', 'Traditional Japanese culture'],
    cons: ['Very crowded at popular sites', 'Hot and humid summers', 'Everything closes early'],
    idealFor: ['Culture enthusiasts', 'History lovers', 'Temple seekers', 'Garden admirers', 'Photographers'],
    highlights: {
      landmarks: [
        { name: 'Fushimi Inari Shrine', description: 'Thousands of vermillion torii gates winding up a sacred mountain - Japan\'s most iconic shrine' },
        { name: 'Kinkaku-ji (Golden Pavilion)', description: 'Zen temple covered in gold leaf, perfectly reflected in its surrounding pond' },
        { name: 'Arashiyama Bamboo Grove', description: 'Towering bamboo stalks create an otherworldly atmosphere in this famous forest path' },
        { name: 'Kiyomizu-dera', description: '1,200-year-old temple with a wooden stage jutting out over the hillside with sweeping city views' },
      ],
      history: [
        { name: 'Imperial Capital (794-1868)', description: 'Japan\'s capital for over 1,000 years and seat of the Emperor until the Meiji Restoration' },
        { name: 'Preserved from WWII', description: 'Spared from bombing due to cultural significance - 2,000+ temples and shrines remain' },
        { name: 'Birthplace of Japanese Culture', description: 'Tea ceremony, ikebana, geisha traditions, and Zen Buddhism all flourished here' },
      ],
      museums: [
        { name: 'Kyoto National Museum', description: 'World-class collection of Japanese art including samurai armor, scrolls, and Buddhist sculptures' },
        { name: 'Nijo Castle', description: 'Shogun\'s palace with "nightingale floors" that chirp to warn of intruders' },
        { name: 'Manga Museum', description: 'Unique museum with 300,000+ manga volumes you can read, plus exhibits on manga history' },
      ],
      markets: [
        { name: 'Nishiki Market', description: '"Kyoto\'s Kitchen" - 400-year-old market with 100+ shops selling pickles, tofu, and Kyoto specialties' },
        { name: 'Gion District', description: 'Historic geisha district with traditional machiya houses, teahouses, and artisan shops' },
        { name: 'Toji Temple Flea Market', description: 'Huge monthly market (21st) with antiques, crafts, and street food around the temple' },
      ],
      food: [
        { name: 'Kaiseki', description: 'Traditional multi-course haute cuisine showcasing seasonal ingredients and artistic presentation' },
        { name: 'Matcha Everything', description: 'Kyoto is Japan\'s tea capital - try matcha sweets, soft serve, and ceremonial tea' },
        { name: 'Yudofu (Tofu Hot Pot)', description: 'Simple but refined tofu dish perfected by Buddhist monks over centuries' },
      ],
    }
  },
  // Thailand
  'Bangkok': { bestFor: ['Food', 'Culture', 'Nightlife'], crowdLevel: 'High', bestTime: 'Nov-Feb', topSites: ['Grand Palace', 'Wat Pho', 'Chatuchak Market', 'Khao San Road'], localTip: 'Use BTS Skytrain and boats to avoid traffic', avgDays: '2-3 days', pros: ['Amazing street food', 'Incredible temples', 'Great value for money'], cons: ['Extreme heat and humidity', 'Traffic congestion', 'Tourist scams around attractions'] },
  'Chiang Mai': { bestFor: ['Culture', 'Nature', 'Wellness'], crowdLevel: 'Moderate', bestTime: 'Nov-Feb', topSites: ['Doi Suthep Temple', 'Old City Temples', 'Night Bazaar', 'Elephant Sanctuaries'], localTip: 'Visit ethical elephant sanctuaries, not riding camps', avgDays: '3-4 days', pros: ['Relaxed pace', 'Rich temple culture', 'Great for digital nomads'], cons: ['Smoky season Mar-Apr', 'Over-commercialized in parts', 'Far from beaches'] },
  'Ayutthaya': {
    bestFor: ['History', 'Architecture', 'Photography'],
    crowdLevel: 'Moderate',
    bestTime: 'Nov-Feb',
    topSites: ['Wat Mahathat (Buddha head in tree)', 'Wat Phra Si Sanphet', 'Ayutthaya Historical Park', 'Bang Pa-In Palace'],
    localTip: 'Rent a bicycle to explore the ruins - the park is spread out over several kilometers',
    avgDays: '1-2 days',
    pros: ['UNESCO World Heritage Site', 'Ancient Siamese capital (1350-1767)', 'Stunning temple ruins', 'Easy day trip from Bangkok'],
    cons: ['Very hot with little shade', 'Spread out ruins require transport', 'Less infrastructure than Bangkok'],
    idealFor: ['History buffs', 'Photography enthusiasts', 'Culture seekers', 'Day-trippers from Bangkok'],
    highlights: {
      landmarks: [
        { name: 'Wat Mahathat', description: 'Famous for the Buddha head entwined in tree roots - the most iconic image of Ayutthaya' },
        { name: 'Wat Phra Si Sanphet', description: 'Three iconic bell-shaped chedis that once held royal relics, former royal temple' },
        { name: 'Wat Chaiwatthanaram', description: 'Stunning Khmer-style temple on the riverbank, best at sunset' },
        { name: 'Wat Ratchaburana', description: 'Impressive prang (tower) you can climb for panoramic views of the ruins' },
      ],
      history: [
        { name: 'Ancient Capital (1350-1767)', description: 'Ayutthaya was the capital of Siam for 417 years and one of the largest cities in the world' },
        { name: 'Portuguese Trade Hub', description: 'First European nation to establish diplomatic relations in 1511, creating a multicultural trading empire' },
        { name: 'The Fall of Ayutthaya', description: 'Destroyed by Burmese invasion in 1767, leaving the haunting ruins you see today' },
      ],
      museums: [
        { name: 'Ayutthaya Historical Study Centre', description: 'Modern museum explaining the rise and fall of the Ayutthaya kingdom with excellent exhibits' },
        { name: 'Chao Sam Phraya National Museum', description: 'Houses treasures found in the ruins including gold artifacts and Buddha images' },
        { name: 'Million Toy Museum', description: 'Quirky private museum with vintage Thai toys and memorabilia' },
      ],
      markets: [
        { name: 'Ayutthaya Floating Market', description: 'Tourist-oriented but fun floating market with boat rides and local food' },
        { name: 'Chao Phrom Market', description: 'Local night market near the train station with authentic Thai street food' },
      ],
      food: [
        { name: 'Boat Noodles', description: 'Ayutthaya is famous for boat noodles (kuay teow reua) - small bowls of intensely flavored noodle soup' },
        { name: 'Roti Sai Mai', description: 'Local specialty - cotton candy wrapped in thin roti crepes, a must-try street snack' },
      ],
    }
  },
  'Phuket': { bestFor: ['Beach', 'Nightlife', 'Water Sports'], crowdLevel: 'High', bestTime: 'Nov-Apr', topSites: ['Patong Beach', 'Big Buddha', 'Old Phuket Town', 'Phi Phi Islands'], localTip: 'Stay in Kata or Karon for beaches without Patong party crowds', avgDays: '3-5 days', pros: ['Beautiful beaches', 'Great diving and snorkeling', 'Island hopping base'], cons: ['Very touristy', 'Overdeveloped in parts', 'Rainy season Jun-Oct'] },
  'Krabi': { bestFor: ['Nature', 'Beach', 'Rock Climbing'], crowdLevel: 'Moderate', bestTime: 'Nov-Apr', topSites: ['Railay Beach', 'Tiger Cave Temple', 'Four Islands', 'Ao Nang'], localTip: 'Railay Beach is only accessible by boat - plan accordingly', avgDays: '3-4 days', pros: ['Dramatic limestone cliffs', 'World-class rock climbing', 'Less crowded than Phuket'], cons: ['Boat-only access to best beaches', 'Limited nightlife', 'Monsoon season flooding'] },
  'Koh Samui': { bestFor: ['Beach', 'Luxury', 'Romance'], crowdLevel: 'Moderate', bestTime: 'Dec-Apr', topSites: ['Chaweng Beach', 'Big Buddha Temple', 'Ang Thong Marine Park', 'Fisherman\'s Village'], localTip: 'Visit during full moon for the famous party on nearby Koh Phangan', avgDays: '3-5 days', pros: ['Beautiful palm-fringed beaches', 'Upscale resorts', 'Good infrastructure'], cons: ['More expensive than mainland', 'Rainy Oct-Dec', 'Full moon party crowds'] },
  'Sukhothai': { bestFor: ['History', 'Culture', 'Cycling'], crowdLevel: 'Low', bestTime: 'Nov-Feb', topSites: ['Sukhothai Historical Park', 'Wat Mahathat', 'Ramkhamhaeng Museum', 'Si Satchanalai'], localTip: 'Rent a bicycle at dawn to see the ruins bathed in golden light', avgDays: '1-2 days', pros: ['Birthplace of Thai civilization', 'UNESCO World Heritage ruins', 'Peaceful and uncrowded'], cons: ['Remote location', 'Limited accommodation', 'Very hot midday'] },
  // France
  'Paris': { bestFor: ['Art', 'Romance', 'Food'], crowdLevel: 'Very High', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Sacré-Cœur'], localTip: 'Skip tourist restaurants - eat where locals queue', avgDays: '4-5 days', pros: ['World-class museums', 'Romantic atmosphere', 'Excellent cuisine'], cons: ['Very expensive', 'Can feel unfriendly', 'Pickpockets at tourist sites'] },
  // Greece
  'Athens': { bestFor: ['History', 'Culture', 'Food'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Acropolis', 'Plaka District', 'Ancient Agora', 'National Archaeological Museum'], localTip: 'Watch sunset from Areopagus Hill with views of the Acropolis', avgDays: '2-3 days', pros: ['Birthplace of democracy', 'Ancient ruins everywhere', 'Great food scene'], cons: ['Very hot in summer', 'Air pollution', 'Graffiti in some areas'] },
  'Santorini': { bestFor: ['Romance', 'Scenery', 'Photography'], crowdLevel: 'Very High', bestTime: 'May-Jun, Sep-Oct', topSites: ['Oia Sunset', 'Fira', 'Red Beach', 'Ancient Akrotiri'], localTip: 'Stay in Imerovigli for Oia views without Oia prices', avgDays: '2-3 days', pros: ['Stunning caldera views', 'Iconic white-washed buildings', 'Amazing sunsets'], cons: ['Extremely crowded', 'Very expensive', 'Cruise ship day-trippers'] },
  // Hawaii
  'Honolulu': { bestFor: ['Beach', 'Culture', 'History'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['Waikiki Beach', 'Diamond Head', 'Pearl Harbor', 'Iolani Palace'], localTip: 'Hike Diamond Head at sunrise before the crowds and heat', avgDays: '3-4 days', pros: ['Perfect weather year-round', 'World-famous beaches', 'Rich Hawaiian culture'], cons: ['Expensive accommodations', 'Crowded at Waikiki', 'Traffic congestion'] },
  'Waikiki': { bestFor: ['Beach', 'Shopping', 'Nightlife'], crowdLevel: 'Very High', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['Waikiki Beach', 'Diamond Head Crater', 'Duke Kahanamoku Statue', 'International Market Place'], localTip: 'Walk to the less crowded Queens Beach section for more space', avgDays: '2-3 days', pros: ['Iconic beach destination', 'Great for beginners surfing', 'Tons of dining options'], cons: ['Very touristy and crowded', 'Expensive hotels', 'Can feel commercial'] },
  'Maui': { bestFor: ['Nature', 'Beach', 'Adventure'], crowdLevel: 'High', bestTime: 'Apr-May, Sep-Nov', topSites: ['Road to Hana', 'Haleakala Sunrise', 'Molokini Crater', 'Lahaina Town'], localTip: 'Book Haleakala sunrise permits well in advance - they sell out', avgDays: '5-7 days', pros: ['Diverse landscapes', 'World-class snorkeling', 'Beautiful beaches'], cons: ['Expensive everywhere', 'Need a car to explore', 'Crowded at popular spots'] },
  'Kauai': { bestFor: ['Nature', 'Adventure', 'Hiking'], crowdLevel: 'Moderate', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['Na Pali Coast', 'Waimea Canyon', 'Hanalei Bay', 'Poipu Beach'], localTip: 'Take a helicopter tour for the best Na Pali Coast views', avgDays: '4-5 days', pros: ['Most scenic Hawaiian island', 'Less developed', 'Amazing hiking trails'], cons: ['Rainy on north shore', 'Limited nightlife', 'Some areas inaccessible by car'] },
  'Big Island': { bestFor: ['Nature', 'Adventure', 'Volcanoes'], crowdLevel: 'Low', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['Hawaii Volcanoes National Park', 'Mauna Kea Summit', 'Akaka Falls', 'Kona Coffee Farms'], localTip: 'Visit Volcanoes National Park at night to see lava glow', avgDays: '4-5 days', pros: ['Active volcanoes', 'Diverse climate zones', 'Less crowded than Maui'], cons: ['Very spread out', 'Need significant driving', 'Some beaches have rough surf'] },
  'Oahu': { bestFor: ['Beach', 'Culture', 'Surfing'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['North Shore', 'Pearl Harbor', 'Hanauma Bay', 'Kailua Beach'], localTip: 'Visit the North Shore in winter for epic big wave surfing', avgDays: '4-5 days', pros: ['Best variety of activities', 'Historic Pearl Harbor', 'Great food scene'], cons: ['Most developed island', 'Traffic around Honolulu', 'Can feel less authentic'] },
  'North Shore': { bestFor: ['Surfing', 'Beach', 'Local Culture'], crowdLevel: 'Moderate', bestTime: 'Nov-Feb (surf), Apr-Sep (swimming)', topSites: ['Pipeline', 'Waimea Bay', 'Haleiwa Town', 'Sunset Beach'], localTip: 'Get garlic shrimp from Giovanni\'s food truck in Kahuku', avgDays: '1-2 days', pros: ['World-famous surf breaks', 'Laid-back vibe', 'Amazing food trucks'], cons: ['Dangerous winter waves', 'Limited accommodations', 'Far from Honolulu'] },
  'Lahaina': { bestFor: ['History', 'Dining', 'Whale Watching'], crowdLevel: 'High', bestTime: 'Dec-Apr (whales), year-round', topSites: ['Front Street', 'Banyan Tree', 'Lahaina Harbor', 'Old Lahaina Luau'], localTip: 'Book whale watching tours Dec-Apr for humpback sightings', avgDays: '1-2 days', pros: ['Historic whaling town charm', 'Great restaurants', 'Whale watching hub'], cons: ['Very hot and dry', 'Crowded streets', 'Limited parking'] },
  'Kona': { bestFor: ['Coffee', 'Beach', 'Snorkeling'], crowdLevel: 'Moderate', bestTime: 'Year-round', topSites: ['Kona Coffee Farms', 'Kealakekua Bay', 'Magic Sands Beach', 'Hulihee Palace'], localTip: 'Snorkel at Two Step (Honaunau) for the best reef experience', avgDays: '2-3 days', pros: ['Sunny weather', 'Famous Kona coffee', 'Great snorkeling'], cons: ['Rocky beaches', 'Resort-heavy areas', 'Can be hot'] },
  // Vietnam
  'Ho Chi Minh City': { bestFor: ['History', 'Food', 'Culture'], crowdLevel: 'High', bestTime: 'Dec-Apr', topSites: ['War Remnants Museum', 'Cu Chi Tunnels', 'Ben Thanh Market', 'Notre-Dame Cathedral'], localTip: 'Take a street food tour in District 1 for authentic pho and banh mi', avgDays: '2-3 days', pros: ['Amazing street food', 'Fascinating history', 'Very affordable'], cons: ['Chaotic traffic', 'Hot and humid', 'Aggressive street vendors'] },
  'Hanoi': { bestFor: ['Culture', 'Food', 'History'], crowdLevel: 'Moderate', bestTime: 'Oct-Dec, Mar-Apr', topSites: ['Old Quarter', 'Hoan Kiem Lake', 'Ho Chi Minh Mausoleum', 'Temple of Literature'], localTip: 'Try egg coffee at Giang Cafe - the original inventor', avgDays: '2-3 days', pros: ['Charming Old Quarter', 'Best Vietnamese coffee', 'Rich culture'], cons: ['Crazy motorbike traffic', 'Can be cold in winter', 'Pushy vendors'] },
  'Ha Long Bay': { bestFor: ['Nature', 'Scenery', 'Cruises'], crowdLevel: 'High', bestTime: 'Oct-Dec, Mar-May', topSites: ['Limestone Karsts', 'Sung Sot Cave', 'Ti Top Island', 'Floating Villages'], localTip: 'Book a 2-night cruise to reach the less crowded Bai Tu Long Bay', avgDays: '2-3 days', pros: ['UNESCO World Heritage scenery', 'Unique kayaking', 'Romantic cruises'], cons: ['Can be foggy', 'Crowded with tour boats', 'Water not always clean'] },
  'Hoi An': { bestFor: ['Culture', 'Shopping', 'Food'], crowdLevel: 'Moderate', bestTime: 'Feb-May', topSites: ['Ancient Town', 'Japanese Bridge', 'Lantern Festival', 'An Bang Beach'], localTip: 'Get custom tailored clothes - many shops can do 24-hour turnaround', avgDays: '2-3 days', pros: ['Beautiful lantern-lit streets', 'Excellent tailors', 'Charming old town'], cons: ['Floods in rainy season', 'Very hot summers', 'Can feel touristy'] },
  'Da Nang': { bestFor: ['Beach', 'Mountains', 'Adventure'], crowdLevel: 'Moderate', bestTime: 'Feb-May', topSites: ['Marble Mountains', 'My Khe Beach', 'Dragon Bridge', 'Ba Na Hills'], localTip: 'Visit Dragon Bridge on weekends at 9pm for fire-breathing show', avgDays: '2-3 days', pros: ['Beautiful beaches', 'Good base for day trips', 'Modern city'], cons: ['Less character than Hoi An', 'Beach can be rough', 'Hot summers'] },
};

// Get city info - first check cache/popular, then generate
export function getCityInfoSync(cityName: string): CityInfo {
  return POPULAR_CITY_INFO[cityName] || {
    bestFor: ['Exploration'],
    crowdLevel: 'Moderate',
    bestTime: 'Spring or Fall',
    topSites: ['Loading...'],
    localTip: 'Loading local insights...',
    avgDays: '2-3 days',
    pros: ['Discover something new'],
    cons: ['More research needed'],
  };
}

export function hasCityInfo(cityName: string): boolean {
  return cityName in POPULAR_CITY_INFO;
}
