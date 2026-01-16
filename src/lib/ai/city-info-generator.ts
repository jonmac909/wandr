import Anthropic from '@anthropic-ai/sdk';

export interface CityHighlight {
  name: string;
  description: string;
}

// Dot ratings for city vibes (1-5 scale)
export interface CityRatings {
  calm: number;      // How peaceful/relaxed (1=chaotic, 5=serene)
  wow: number;       // Visual/emotional impact (1=ordinary, 5=jaw-dropping)
  history: number;   // Historical depth (1=modern, 5=ancient layers)
  friction: number;  // Hassle factor (1=smooth, 5=challenging)
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
  // NEW: Dot ratings for quick vibe assessment
  ratings?: CityRatings;
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
  "topSites": ["4 specific famous landmarks/attractions in this city - use actual names"],
  "localTip": "One specific insider tip that locals would know",
  "avgDays": "Recommended days to spend, e.g., '2-3 days'",
  "pros": ["3 specific positive things about visiting this city"],
  "cons": ["3 specific drawbacks or challenges"],
  "ratings": {
    "calm": 1-5 (1=chaotic/busy, 5=peaceful/serene),
    "wow": 1-5 (1=ordinary, 5=jaw-dropping visuals/experiences),
    "history": 1-5 (1=modern city, 5=ancient layers of history),
    "friction": 1-5 (1=easy/smooth travel, 5=challenging logistics)
  },
  "idealFor": ["3-4 traveler types this city suits best"],
  "highlights": {
    "landmarks": [{"name": "Landmark Name", "description": "Brief compelling description"}],
    "history": [{"name": "Historical Period/Event", "description": "Brief interesting fact"}],
    "food": [{"name": "Dish or Food Experience", "description": "Why it's special"}]
  }
}

Be specific to ${cityName}. Use real landmark names, actual best seasons, and genuine local insights. Include 3-4 items per highlights category.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
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
    ratings: { calm: 2, wow: 5, history: 5, friction: 3 },
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
  'Cappadocia': { bestFor: ['Nature', 'Adventure', 'Photography'], crowdLevel: 'Moderate', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Hot Air Balloon Rides', 'Göreme Open Air Museum', 'Underground Cities', 'Fairy Chimneys'], localTip: 'Book balloon rides weeks in advance for sunrise flights', avgDays: '2-3 days', pros: ['Otherworldly landscapes', 'Unique cave hotels', 'Bucket-list balloon rides'], cons: ['Balloon flights often cancelled due to weather', 'Limited nightlife', 'Remote location'], ratings: { calm: 4, wow: 5, history: 4, friction: 2 } },
  'Antalya': { bestFor: ['Beach', 'History', 'Relaxation'], crowdLevel: 'Moderate', bestTime: 'May-Jun, Sep-Oct', topSites: ['Kaleiçi Old Town', 'Düden Waterfalls', 'Aspendos Theater', 'Konyaaltı Beach'], localTip: 'Visit Perge and Aspendos ancient ruins nearby', avgDays: '2-3 days', pros: ['Beautiful beaches', 'Ancient ruins nearby', 'Good weather most of year'], cons: ['Very touristy in summer', 'Resort-heavy areas', 'Can feel commercialized'], ratings: { calm: 4, wow: 3, history: 3, friction: 2 } },
  'Bodrum': { bestFor: ['Beach', 'Nightlife', 'Sailing'], crowdLevel: 'High', bestTime: 'Jun-Sep', topSites: ['Bodrum Castle', 'Mausoleum of Halicarnassus', 'Bodrum Marina', 'Gümbet Beach'], localTip: 'Take a blue cruise on a traditional gulet to explore hidden coves', avgDays: '2-3 days', pros: ['Turkish Riviera vibes', 'Great sailing scene', 'Vibrant nightlife'], cons: ['Very crowded in summer', 'Expensive for Turkey', 'Party-focused atmosphere'], ratings: { calm: 2, wow: 3, history: 2, friction: 2 } },
  'Trabzon': { bestFor: ['Nature', 'History', 'Culture'], crowdLevel: 'Low', bestTime: 'May-Sep', topSites: ['Sumela Monastery', 'Uzungöl Lake', 'Trabzon Hagia Sophia', 'Boztepe Hill'], localTip: 'Drive the scenic highland road to Ayder Plateau for lush green meadows', avgDays: '2-3 days', pros: ['Spectacular mountain scenery', 'Unique Black Sea culture', 'Uncrowded and authentic'], cons: ['Far from other tourist areas', 'Rainy weather possible', 'Limited English spoken'], ratings: { calm: 5, wow: 4, history: 3, friction: 4 } },
  'Konya': { bestFor: ['Spirituality', 'History', 'Culture'], crowdLevel: 'Low', bestTime: 'Dec (Whirling Dervishes), Apr-Jun', topSites: ['Mevlana Museum', 'Alaeddin Mosque', 'Karatay Medrese', 'Sille Village'], localTip: 'Visit during December for Whirling Dervishes Sema ceremonies', avgDays: '1-2 days', pros: ['Spiritual home of Rumi', 'Rich Seljuk architecture', 'Authentic Turkish experience'], cons: ['Conservative dress expected', 'Very hot in summer', 'Limited tourist amenities'], ratings: { calm: 4, wow: 3, history: 5, friction: 3 } },
  // Spain
  'Barcelona': {
    bestFor: ['Architecture', 'Beach', 'Nightlife'],
    crowdLevel: 'Very High',
    bestTime: 'May-Jun, Sep-Oct',
    topSites: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Gothic Quarter'],
    localTip: 'Book Sagrada Familia tickets online weeks ahead',
    avgDays: '3-4 days',
    pros: ['Unique Gaudí architecture', 'Beach and city combined', 'Vibrant nightlife'],
    cons: ['Extremely crowded', 'Pickpockets on La Rambla', 'Overtourism concerns'],
    ratings: { calm: 2, wow: 5, history: 4, friction: 3 },
    idealFor: ['Architecture lovers', 'Beach seekers', 'Foodies', 'Party goers', 'Art enthusiasts'],
    highlights: {
      landmarks: [
        { name: 'Sagrada Familia', description: 'Gaudí\'s unfinished masterpiece - the world\'s most extraordinary church, under construction since 1882' },
        { name: 'Park Güell', description: 'Whimsical mosaic-covered park with dragon fountain and panoramic city views' },
        { name: 'Casa Batlló', description: 'Gaudí\'s surreal house with skull balconies and dragon-scale roof' },
        { name: 'Gothic Quarter', description: 'Medieval maze of narrow streets, hidden plazas, and Roman ruins' },
      ],
      history: [
        { name: 'Roman Barcino', description: 'Founded in 10 BC - original Roman walls and columns still visible in the Gothic Quarter' },
        { name: 'Catalan Identity', description: 'Proud capital of Catalonia with its own language, traditions, and independence movement' },
        { name: 'Modernisme Movement', description: 'Gaudí and other architects created unique Catalan Art Nouveau style (1888-1911)' },
      ],
      markets: [
        { name: 'La Boqueria', description: 'Famous food market on La Rambla with fresh produce, seafood, and tapas stalls since 1217' },
        { name: 'Mercat de Sant Josep', description: 'Less touristy neighborhood market with excellent Spanish ham and cheese' },
        { name: 'El Born District', description: 'Trendy area with boutiques, craft cocktail bars, and the Picasso Museum' },
      ],
      food: [
        { name: 'Tapas Crawl', description: 'Hop between bars for patatas bravas, jamón ibérico, and pan con tomate' },
        { name: 'Paella & Fideuà', description: 'Seafood rice dishes best enjoyed beachside at Barceloneta' },
        { name: 'Vermouth Hour', description: 'Local tradition - sip vermut with olives and chips before lunch' },
      ],
    }
  },
  'Madrid': { bestFor: ['Art', 'Food', 'Nightlife'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['Prado Museum', 'Royal Palace', 'Retiro Park', 'Plaza Mayor'], localTip: 'Dinner starts at 9-10pm - embrace the late Spanish schedule', avgDays: '2-3 days', pros: ['World-class art museums', 'Fantastic food scene', 'Less touristy than Barcelona'], cons: ['Hot summers', 'Late schedule takes adjustment', 'No beach'], ratings: { calm: 3, wow: 4, history: 4, friction: 2 } },
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
    ratings: { calm: 2, wow: 5, history: 5, friction: 3 },
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
  'Florence': { bestFor: ['Art', 'Architecture', 'Food'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Uffizi Gallery', 'Duomo', 'Ponte Vecchio', 'Accademia'], localTip: 'Climb the Duomo dome at sunset for magical views', avgDays: '2-3 days', pros: ['Renaissance art capital', 'Walkable historic center', 'Tuscan food and wine'], cons: ['Very crowded', 'Expensive near center', 'Can feel like a museum'], ratings: { calm: 3, wow: 5, history: 5, friction: 2 } },
  'Venice': { bestFor: ['Romance', 'Art', 'Architecture'], crowdLevel: 'Very High', bestTime: 'Mar-May, Sep-Nov', topSites: ['St. Mark\'s Basilica', 'Grand Canal', 'Rialto Bridge', 'Doge\'s Palace'], localTip: 'Get lost in Dorsoduro for authentic local experience', avgDays: '2-3 days', pros: ['Truly unique city', 'Romantic atmosphere', 'No cars'], cons: ['Extremely crowded', 'Very expensive', 'Flooding risk'], ratings: { calm: 2, wow: 5, history: 5, friction: 4 } },
  // Japan
  'Tokyo': {
    bestFor: ['Culture', 'Food', 'Technology'],
    crowdLevel: 'High',
    bestTime: 'Mar-May, Sep-Nov',
    topSites: ['Senso-ji Temple', 'Shibuya Crossing', 'Meiji Shrine', 'Tsukiji Market'],
    localTip: 'Get a Suica card for seamless train travel',
    avgDays: '4-5 days',
    pros: ['Incredible food scene', 'Perfect blend of old and new', 'Extremely safe'],
    cons: ['Language barrier', 'Can be overwhelming', 'Expensive accommodations'],
    ratings: { calm: 2, wow: 5, history: 3, friction: 2 },
    idealFor: ['Foodies', 'Tech enthusiasts', 'Culture seekers', 'Anime fans', 'Photographers'],
    highlights: {
      landmarks: [
        { name: 'Senso-ji Temple', description: 'Tokyo\'s oldest temple (628 AD) with iconic Kaminarimon gate and Nakamise shopping street' },
        { name: 'Shibuya Crossing', description: 'World\'s busiest intersection - up to 3,000 people cross at once in organized chaos' },
        { name: 'Meiji Shrine', description: 'Serene Shinto shrine in a 170-acre forest - a peaceful escape in the heart of the city' },
        { name: 'Tokyo Skytree', description: 'World\'s tallest tower (634m) with observation decks offering views to Mt. Fuji on clear days' },
      ],
      history: [
        { name: 'Edo Period (1603-1868)', description: 'Tokyo was called Edo - the shogun\'s capital and world\'s largest city by the 1700s' },
        { name: 'Post-War Rebirth', description: 'Rebuilt from WWII devastation to become the world\'s largest metro area' },
        { name: 'Imperial Palace', description: 'Emperor\'s residence on the site of the original Edo Castle - gardens open to public' },
      ],
      markets: [
        { name: 'Tsukiji Outer Market', description: 'Legendary fish market (moved to Toyosu) - outer stalls still serve the freshest sushi breakfast' },
        { name: 'Ameya-Yokocho (Ameyoko)', description: 'Bustling market street near Ueno with food, clothes, and old-school Tokyo vibes' },
        { name: 'Takeshita Street', description: 'Harajuku\'s colorful teen fashion mecca with crepes, kawaii shops, and street style' },
      ],
      food: [
        { name: 'Sushi & Sashimi', description: 'From Michelin-starred omakase to standing-only counters - Tokyo has the most sushi masters' },
        { name: 'Ramen Obsession', description: 'Every neighborhood has its own style - try Ichiran for tonkotsu or Fuunji for tsukemen' },
        { name: 'Depachika (Department Store Basements)', description: 'Food halls with perfect bento, wagashi sweets, and free samples galore' },
      ],
    }
  },
  'Kyoto': {
    bestFor: ['History', 'Culture', 'Nature'],
    crowdLevel: 'High',
    bestTime: 'Mar-May, Oct-Nov',
    topSites: ['Fushimi Inari Shrine', 'Kinkaku-ji', 'Arashiyama Bamboo Grove', 'Gion District'],
    localTip: 'Visit Fushimi Inari at dawn to avoid crowds',
    avgDays: '3-4 days',
    pros: ['Ancient temples and shrines', 'Beautiful gardens', 'Traditional Japanese culture'],
    cons: ['Very crowded at popular sites', 'Hot and humid summers', 'Everything closes early'],
    ratings: { calm: 4, wow: 5, history: 5, friction: 2 },
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
  'Bangkok': {
    bestFor: ['Food', 'Culture', 'Nightlife'],
    crowdLevel: 'High',
    bestTime: 'Nov-Feb',
    topSites: ['Grand Palace', 'Wat Pho', 'Chatuchak Market', 'Khao San Road'],
    localTip: 'Use BTS Skytrain and boats to avoid traffic',
    avgDays: '2-3 days',
    pros: ['Amazing street food', 'Incredible temples', 'Great value for money'],
    cons: ['Extreme heat and humidity', 'Traffic congestion', 'Tourist scams around attractions'],
    ratings: { calm: 1, wow: 4, history: 3, friction: 3 },
    idealFor: ['Foodies', 'Night owls', 'Budget travelers', 'Culture seekers'],
    highlights: {
      landmarks: [
        { name: 'Grand Palace', description: 'Dazzling royal complex with the sacred Emerald Buddha - Thailand\'s most important landmark' },
        { name: 'Wat Pho', description: 'Home to the 46-meter reclining Buddha and birthplace of Thai massage' },
        { name: 'Wat Arun', description: 'Iconic "Temple of Dawn" with Khmer-style spires covered in colorful porcelain' },
        { name: 'Jim Thompson House', description: 'Traditional Thai teakwood house museum showcasing silk merchant\'s art collection' },
      ],
      history: [
        { name: 'Rattanakosin Era (1782-present)', description: 'Bangkok became capital when King Rama I built the Grand Palace' },
        { name: 'The Venice of the East', description: 'Once a city of canals (klongs) - explore remaining waterways by longtail boat' },
        { name: 'WWII & Modern Era', description: 'From R&R destination for GIs to modern megacity of 10+ million people' },
      ],
      markets: [
        { name: 'Chatuchak Weekend Market', description: 'One of world\'s largest markets with 15,000 stalls - arrive early to beat the heat' },
        { name: 'Asiatique Night Bazaar', description: 'Riverside night market in converted warehouses with dining and entertainment' },
        { name: 'Or Tor Kor Market', description: 'Thailand\'s best fresh market - come hungry for exotic fruits and curry' },
      ],
      food: [
        { name: 'Street Food Paradise', description: 'From pad thai to som tam, Bangkok\'s street vendors are legendary - try Yaowarat (Chinatown)' },
        { name: 'Tom Yum & Green Curry', description: 'Iconic Thai dishes at their finest - the heat and flavor are unmatched' },
        { name: 'Mango Sticky Rice', description: 'Sweet, creamy coconut dessert perfected in Thailand - best during mango season (Apr-Jun)' },
      ],
    }
  },
  'Chiang Mai': {
    bestFor: ['Culture', 'Nature', 'Wellness'],
    crowdLevel: 'Moderate',
    bestTime: 'Nov-Feb',
    topSites: ['Doi Suthep Temple', 'Old City Temples', 'Night Bazaar', 'Elephant Sanctuaries'],
    localTip: 'Visit ethical elephant sanctuaries, not riding camps',
    avgDays: '3-4 days',
    pros: ['Relaxed pace', 'Rich temple culture', 'Great for digital nomads'],
    cons: ['Smoky season Mar-Apr', 'Over-commercialized in parts', 'Far from beaches'],
    ratings: { calm: 4, wow: 4, history: 4, friction: 2 },
    idealFor: ['Wellness seekers', 'Digital nomads', 'Temple lovers', 'Nature enthusiasts'],
    highlights: {
      landmarks: [
        { name: 'Doi Suthep Temple', description: 'Sacred hilltop temple with 300 naga stairs and panoramic city views' },
        { name: 'Old City Temples', description: 'Walk among 30+ ancient temples within the moat - Wat Chedi Luang\'s ruins are stunning' },
        { name: 'Doi Inthanon', description: 'Thailand\'s highest peak with misty trails, waterfalls, and hill tribe villages' },
        { name: 'White Temple (Wat Rong Khun)', description: 'Otherworldly contemporary temple 3 hours north in Chiang Rai' },
      ],
      history: [
        { name: 'Lanna Kingdom Capital', description: 'Founded in 1296, Chiang Mai was the capital of the Lanna Kingdom for centuries' },
        { name: 'Hill Tribe Heritage', description: 'Home to Karen, Hmong, and other tribes with distinct cultures and crafts' },
        { name: 'Buddhist Learning Center', description: 'Meditation retreats and monk chats continue traditions passed down for centuries' },
      ],
      markets: [
        { name: 'Sunday Walking Street', description: 'Massive night market stretching through Old City with crafts, food, and live music' },
        { name: 'Night Bazaar', description: 'Daily evening market along Chang Klan Road - great for souvenirs and street food' },
        { name: 'Warorot Market', description: 'Local market for spices, northern Thai food, and authentic shopping' },
      ],
      food: [
        { name: 'Khao Soi', description: 'Chiang Mai\'s signature dish - creamy coconut curry noodles with crispy egg noodles on top' },
        { name: 'Sai Oua (Northern Sausage)', description: 'Herb-packed pork sausage with lemongrass, galangal, and kaffir lime' },
        { name: 'Cooking Classes', description: 'Learn Thai cooking at a farm school - includes market tour and hands-on cooking' },
      ],
      nature: [
        { name: 'Elephant Nature Park', description: 'Ethical sanctuary where rescued elephants roam free - no riding, just observing' },
        { name: 'Sticky Waterfalls', description: 'Unique limestone falls you can climb up - the mineral deposits make it grippy' },
        { name: 'Mae Sa Valley', description: 'Scenic loop with orchid farms, zip lines, and the Hmong village of Doi Pui' },
      ],
    }
  },
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
  'Kanchanaburi': {
    bestFor: ['History', 'Nature', 'Adventure'],
    crowdLevel: 'Low',
    bestTime: 'Nov-Feb',
    topSites: ['Bridge over River Kwai', 'Erawan National Park', 'Death Railway', 'Hellfire Pass'],
    localTip: 'Take the historic train ride along the Death Railway for stunning views over the river',
    avgDays: '2-3 days',
    pros: ['WWII history sites', 'Stunning waterfalls', 'Less touristy than other areas'],
    cons: ['Spread out attractions require transport', 'Very hot in summer', 'Limited nightlife'],
    ratings: { calm: 4, wow: 4, history: 5, friction: 2 },
    idealFor: ['History buffs', 'Nature lovers', 'Off-the-beaten-path seekers'],
    highlights: {
      landmarks: [
        { name: 'Bridge over River Kwai', description: 'Famous WWII bridge rebuilt after Allied bombing - walk across and see the museum' },
        { name: 'Death Railway', description: 'Historic railway built by POWs - take the scenic train ride along the original route' },
        { name: 'Hellfire Pass', description: 'Moving memorial cut through rock by hand - excellent museum tells POW stories' },
        { name: 'JEATH War Museum', description: 'Replica POW camp with artifacts and photos from the Burma Railway construction' },
      ],
      history: [
        { name: 'Burma Railway (1942-1943)', description: 'Over 100,000 POWs and laborers died building the "Death Railway" for Japanese forces' },
        { name: 'Allied War Cemeteries', description: 'Beautifully maintained graves of 6,982 POWs who died during construction' },
      ],
      nature: [
        { name: 'Erawan National Park', description: 'Seven-tiered turquoise waterfall - swim in the pools if you hike to the top' },
        { name: 'Sai Yok National Park', description: 'Caves, smaller waterfalls, and bamboo rafting on the Kwai Noi River' },
        { name: 'Elephant World Sanctuary', description: 'Ethical elephant care center where you can observe rescued elephants' },
      ],
      food: [
        { name: 'Floating Restaurants', description: 'Dine on rafts along the River Kwai with fresh river fish and Thai classics' },
        { name: 'Local Markets', description: 'Night market near the bridge for authentic Thai street food' },
      ],
    }
  },
  'Phuket': { bestFor: ['Beach', 'Nightlife', 'Water Sports'], crowdLevel: 'High', bestTime: 'Nov-Apr', topSites: ['Patong Beach', 'Big Buddha', 'Old Phuket Town', 'Phi Phi Islands'], localTip: 'Stay in Kata or Karon for beaches without Patong party crowds', avgDays: '3-5 days', pros: ['Beautiful beaches', 'Great diving and snorkeling', 'Island hopping base'], cons: ['Very touristy', 'Overdeveloped in parts', 'Rainy season Jun-Oct'] },
  'Krabi': { bestFor: ['Nature', 'Beach', 'Rock Climbing'], crowdLevel: 'Moderate', bestTime: 'Nov-Apr', topSites: ['Railay Beach', 'Tiger Cave Temple', 'Four Islands', 'Ao Nang'], localTip: 'Railay Beach is only accessible by boat - plan accordingly', avgDays: '3-4 days', pros: ['Dramatic limestone cliffs', 'World-class rock climbing', 'Less crowded than Phuket'], cons: ['Boat-only access to best beaches', 'Limited nightlife', 'Monsoon season flooding'] },
  'Koh Samui': { bestFor: ['Beach', 'Luxury', 'Romance'], crowdLevel: 'Moderate', bestTime: 'Dec-Apr', topSites: ['Chaweng Beach', 'Big Buddha Temple', 'Ang Thong Marine Park', 'Fisherman\'s Village'], localTip: 'Visit during full moon for the famous party on nearby Koh Phangan', avgDays: '3-5 days', pros: ['Beautiful palm-fringed beaches', 'Upscale resorts', 'Good infrastructure'], cons: ['More expensive than mainland', 'Rainy Oct-Dec', 'Full moon party crowds'] },
  'Sukhothai': { bestFor: ['History', 'Culture', 'Cycling'], crowdLevel: 'Low', bestTime: 'Nov-Feb', topSites: ['Sukhothai Historical Park', 'Wat Mahathat', 'Ramkhamhaeng Museum', 'Si Satchanalai'], localTip: 'Rent a bicycle at dawn to see the ruins bathed in golden light', avgDays: '1-2 days', pros: ['Birthplace of Thai civilization', 'UNESCO World Heritage ruins', 'Peaceful and uncrowded'], cons: ['Remote location', 'Limited accommodation', 'Very hot midday'] },
  // France
  'Paris': {
    bestFor: ['Art', 'Romance', 'Food'],
    crowdLevel: 'Very High',
    bestTime: 'Apr-Jun, Sep-Oct',
    topSites: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Sacré-Cœur'],
    localTip: 'Skip tourist restaurants - eat where locals queue',
    avgDays: '4-5 days',
    pros: ['World-class museums', 'Romantic atmosphere', 'Excellent cuisine'],
    cons: ['Very expensive', 'Can feel unfriendly', 'Pickpockets at tourist sites'],
    ratings: { calm: 2, wow: 5, history: 5, friction: 3 },
    idealFor: ['Art lovers', 'Romantics', 'Foodies', 'Fashion enthusiasts', 'History buffs'],
    highlights: {
      landmarks: [
        { name: 'Eiffel Tower', description: 'The world\'s most iconic landmark - dine at Jules Verne or just picnic beneath it' },
        { name: 'Notre-Dame Cathedral', description: 'Gothic masterpiece on Île de la Cité - under restoration after 2019 fire' },
        { name: 'Arc de Triomphe', description: 'Napoleon\'s victory arch at the top of Champs-Élysées with rooftop views' },
        { name: 'Sacré-Cœur', description: 'White-domed basilica atop Montmartre with sweeping city views' },
      ],
      history: [
        { name: 'Roman Lutetia', description: 'Founded over 2,000 years ago - Roman baths and arena still visible in Latin Quarter' },
        { name: 'French Revolution', description: 'Stormed the Bastille in 1789 - visit Place de la Concorde where the guillotine stood' },
        { name: 'Belle Époque', description: 'Golden age of cafés, cabarets, and artists (1880-1914) still lives in Montmartre' },
      ],
      museums: [
        { name: 'The Louvre', description: 'World\'s largest museum with 35,000 works including the Mona Lisa - book timed entry' },
        { name: 'Musée d\'Orsay', description: 'Impressionist masterpieces in a stunning Beaux-Arts train station' },
        { name: 'Centre Pompidou', description: 'Modern art collection in an inside-out building with colored pipes' },
      ],
      markets: [
        { name: 'Marché des Enfants Rouges', description: 'Paris\'s oldest covered market (1615) with incredible lunch stalls' },
        { name: 'Rue Mouffetard', description: 'Medieval market street in the Latin Quarter with cheese, bread, and wine shops' },
        { name: 'Marché aux Puces de Saint-Ouen', description: 'World\'s largest antique market with 2,500+ dealers' },
      ],
      food: [
        { name: 'Croissants & Baguettes', description: 'Start mornings at a local boulangerie - Du Pain et des Idées is legendary' },
        { name: 'Bistro Classics', description: 'Steak frites, coq au vin, onion soup - timeless French comfort food' },
        { name: 'Wine & Cheese', description: 'Every neighborhood has caves à vin for natural wine and artisan fromageries' },
      ],
    }
  },
  // Greece
  'Athens': {
    bestFor: ['History', 'Culture', 'Food'],
    crowdLevel: 'High',
    bestTime: 'Apr-Jun, Sep-Oct',
    topSites: ['Acropolis', 'Plaka District', 'Ancient Agora', 'National Archaeological Museum'],
    localTip: 'Watch sunset from Areopagus Hill with views of the Acropolis',
    avgDays: '2-3 days',
    pros: ['Birthplace of democracy', 'Ancient ruins everywhere', 'Great food scene'],
    cons: ['Very hot in summer', 'Air pollution', 'Graffiti in some areas'],
    ratings: { calm: 2, wow: 5, history: 5, friction: 2 },
    idealFor: ['History buffs', 'Culture seekers', 'Foodies', 'Philosophy lovers'],
    highlights: {
      landmarks: [
        { name: 'The Acropolis', description: 'Ancient citadel perched above the city with the iconic Parthenon temple (447 BC)' },
        { name: 'Parthenon', description: 'Temple to goddess Athena - the defining symbol of ancient Greek civilization' },
        { name: 'Temple of Olympian Zeus', description: 'Massive temple ruins with 17 of the original 104 columns still standing' },
        { name: 'Panathenaic Stadium', description: 'Marble stadium from 330 BC where the first modern Olympics were held (1896)' },
      ],
      history: [
        { name: 'Birthplace of Democracy', description: 'Citizens voted in the Agora - the world\'s first democratic system (508 BC)' },
        { name: 'Classical Golden Age', description: 'Socrates, Plato, Aristotle - philosophy was invented here in the 5th century BC' },
        { name: 'Ottoman Athens', description: 'Under Ottoman rule for 400 years until Greek independence in 1832' },
      ],
      museums: [
        { name: 'Acropolis Museum', description: 'Stunning modern museum with Parthenon sculptures and ancient artifacts' },
        { name: 'National Archaeological Museum', description: 'One of the world\'s greatest collections of Greek antiquities' },
        { name: 'Ancient Agora', description: 'The original marketplace and civic center - walk where Socrates taught' },
      ],
      markets: [
        { name: 'Plaka District', description: 'Charming old neighborhood at the Acropolis foot with shops, tavernas, and winding streets' },
        { name: 'Monastiraki Flea Market', description: 'Bustling market with antiques, souvenirs, and street food every Sunday' },
        { name: 'Central Market (Varvakios)', description: 'Authentic meat and fish market surrounded by tavernas serving fresh catches' },
      ],
      food: [
        { name: 'Souvlaki & Gyros', description: 'Grilled meat wrapped in warm pita with tzatziki - Athens does it best' },
        { name: 'Mezedes', description: 'Small plates culture - order many and share over ouzo or tsipouro' },
        { name: 'Fresh Seafood', description: 'Head to Piraeus port or Psiri neighborhood for grilled octopus and fish' },
      ],
    }
  },
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
  'Ho Chi Minh City': {
    bestFor: ['History', 'Food', 'Culture'],
    crowdLevel: 'High',
    bestTime: 'Dec-Apr',
    topSites: ['War Remnants Museum', 'Cu Chi Tunnels', 'Ben Thanh Market', 'Notre-Dame Cathedral'],
    localTip: 'Take a street food tour in District 1 for authentic pho and banh mi',
    avgDays: '2-3 days',
    pros: ['Amazing street food', 'Fascinating history', 'Very affordable'],
    cons: ['Chaotic traffic', 'Hot and humid', 'Aggressive street vendors'],
    ratings: { calm: 1, wow: 3, history: 4, friction: 4 },
    idealFor: ['History buffs', 'Foodies', 'Budget travelers', 'Adventure seekers'],
    highlights: {
      landmarks: [
        { name: 'War Remnants Museum', description: 'Powerful and sobering museum documenting the Vietnam War with artifacts and photos' },
        { name: 'Notre-Dame Cathedral', description: 'Beautiful French colonial-era cathedral built with red bricks imported from Marseille' },
        { name: 'Central Post Office', description: 'Gorgeous colonial building designed by Gustave Eiffel - still a working post office' },
        { name: 'Independence Palace', description: 'Former presidential palace where the Vietnam War ended - original 1960s interiors preserved' },
      ],
      history: [
        { name: 'French Colonial Era', description: 'Known as Saigon until 1976 - French architecture and wide boulevards still visible' },
        { name: 'Vietnam War', description: 'Fell to North Vietnamese forces in 1975 - Cu Chi Tunnels show guerrilla warfare tactics' },
        { name: 'Modern Resurgence', description: 'Vietnam\'s economic hub with 9 million people and explosive growth' },
      ],
      markets: [
        { name: 'Ben Thanh Market', description: 'Iconic covered market since 1914 - great for souvenirs but haggle hard' },
        { name: 'Binh Tay Market (Cholon)', description: 'Huge wholesale market in Chinatown - more authentic, less touristy' },
        { name: 'Street Food Alley', description: 'District 4 has some of the best street food stalls in the city' },
      ],
      food: [
        { name: 'Pho & Banh Mi', description: 'Southern-style pho with fresh herbs + crispy banh mi - cheaper and better than anywhere' },
        { name: 'Bánh Xèo', description: 'Crispy Vietnamese crepes filled with shrimp, pork, and bean sprouts' },
        { name: 'Vietnamese Coffee', description: 'Strong drip coffee with condensed milk - invented here during French era' },
      ],
    }
  },
  'Hanoi': {
    bestFor: ['Culture', 'Food', 'History'],
    crowdLevel: 'Moderate',
    bestTime: 'Oct-Dec, Mar-Apr',
    topSites: ['Old Quarter', 'Hoan Kiem Lake', 'Ho Chi Minh Mausoleum', 'Temple of Literature'],
    localTip: 'Try egg coffee at Giang Cafe - the original inventor',
    avgDays: '2-3 days',
    pros: ['Charming Old Quarter', 'Best Vietnamese coffee', 'Rich culture'],
    cons: ['Crazy motorbike traffic', 'Can be cold in winter', 'Pushy vendors'],
    ratings: { calm: 2, wow: 4, history: 5, friction: 3 },
    idealFor: ['Culture lovers', 'Foodies', 'History enthusiasts', 'Coffee addicts'],
    highlights: {
      landmarks: [
        { name: 'Hoan Kiem Lake', description: 'Legendary lake in the heart of Hanoi with the iconic red Huc Bridge and temple' },
        { name: 'Ho Chi Minh Mausoleum', description: 'Imposing granite memorial where Ho Chi Minh lies in state - strict dress code' },
        { name: 'Temple of Literature', description: 'Vietnam\'s first university (1070) with peaceful courtyards and ancient architecture' },
        { name: 'Old Quarter (36 Streets)', description: 'Maze of narrow streets named by trade - best explored on foot or cyclo' },
      ],
      history: [
        { name: '1000+ Years as Capital', description: 'Thang Long (Hanoi) has been Vietnam\'s capital since 1010 AD' },
        { name: 'French Indochina', description: 'Colonial architecture blends with traditional Vietnamese - see Opera House and St. Joseph\'s' },
        { name: 'Ho Chi Minh\'s Legacy', description: 'Revolutionary leader lived and worked here - visit his simple stilt house' },
      ],
      markets: [
        { name: 'Dong Xuan Market', description: 'Hanoi\'s largest covered market with three floors of everything imaginable' },
        { name: 'Old Quarter Night Market', description: 'Friday-Sunday nights the streets close for walking, food, and shopping' },
        { name: 'Long Bien Market', description: 'Wholesale market under Long Bien Bridge - best at 2-4am for real local experience' },
      ],
      food: [
        { name: 'Egg Coffee (Cà Phê Trứng)', description: 'Hanoi\'s unique invention - whipped egg yolk, sugar, and strong coffee - try at Giang Cafe' },
        { name: 'Bun Cha', description: 'Obama ate this with Bourdain at Bun Cha Huong Lien - grilled pork with noodles' },
        { name: 'Pho Bo', description: 'Northern-style beef pho is simpler and more subtle than the southern version' },
      ],
    }
  },
  'Ha Long Bay': {
    bestFor: ['Nature', 'Scenery', 'Cruises'],
    crowdLevel: 'High',
    bestTime: 'Oct-Dec, Mar-May',
    topSites: ['Limestone Karsts', 'Sung Sot Cave', 'Ti Top Island', 'Floating Villages'],
    localTip: 'Book a 2-night cruise to reach the less crowded Bai Tu Long Bay',
    avgDays: '2-3 days',
    pros: ['UNESCO World Heritage scenery', 'Unique kayaking', 'Romantic cruises'],
    cons: ['Can be foggy', 'Crowded with tour boats', 'Water not always clean'],
    ratings: { calm: 4, wow: 5, history: 2, friction: 2 },
    idealFor: ['Nature lovers', 'Couples', 'Photographers', 'Adventure seekers'],
    highlights: {
      landmarks: [
        { name: 'Limestone Karsts', description: 'Nearly 2,000 islands and islets rising dramatically from emerald waters' },
        { name: 'Sung Sot Cave (Surprise Cave)', description: 'Massive cave system with impressive stalactites and stalagmites' },
        { name: 'Ti Top Island', description: 'Climb 400 steps for panoramic bay views, or swim at the small beach' },
        { name: 'Dau Go Cave', description: '"Wooden Stakes Cave" - named for weapons hidden here against Mongol invaders' },
      ],
      nature: [
        { name: 'Kayaking Through Karsts', description: 'Paddle through hidden lagoons and caves at your own pace' },
        { name: 'Floating Fishing Villages', description: 'See traditional life on the water - some families live here year-round' },
        { name: 'Cat Ba Island', description: 'Largest island in the bay with national park, hiking, and rock climbing' },
      ],
      food: [
        { name: 'Fresh Seafood', description: 'Cruises serve incredible seafood - squid, prawns, and fish caught that morning' },
        { name: 'Cooking Classes', description: 'Many cruises offer spring roll and Vietnamese cooking classes on board' },
      ],
    }
  },
  'Hoi An': {
    bestFor: ['Culture', 'Shopping', 'Food'],
    crowdLevel: 'Moderate',
    bestTime: 'Feb-May',
    topSites: ['Ancient Town', 'Japanese Bridge', 'Lantern Festival', 'An Bang Beach'],
    localTip: 'Get custom tailored clothes - many shops can do 24-hour turnaround',
    avgDays: '2-3 days',
    pros: ['Beautiful lantern-lit streets', 'Excellent tailors', 'Charming old town'],
    cons: ['Floods in rainy season', 'Very hot summers', 'Can feel touristy'],
    ratings: { calm: 4, wow: 4, history: 4, friction: 2 },
    idealFor: ['Culture seekers', 'Shoppers', 'Foodies', 'Photographers', 'Beach lovers'],
    highlights: {
      landmarks: [
        { name: 'Japanese Covered Bridge', description: 'Iconic 400-year-old bridge connecting Chinese and Japanese quarters' },
        { name: 'Ancient Town (UNESCO)', description: 'Perfectly preserved trading port with Chinese, Japanese, and French influences' },
        { name: 'Assembly Halls', description: 'Elaborate Chinese clan meeting halls - Fujian and Cantonese are most impressive' },
        { name: 'Tra Que Vegetable Village', description: 'Traditional farming village where you can learn organic gardening and cooking' },
      ],
      markets: [
        { name: 'Central Market', description: 'Bustling morning market by the river with fresh produce and street food' },
        { name: 'Lantern Street', description: 'Dozens of shops selling handmade silk lanterns in every color and shape' },
        { name: 'Tailoring Shops', description: 'World-famous for custom suits, dresses, and shoes - 24-48 hour turnaround' },
      ],
      food: [
        { name: 'Cao Lau', description: 'Hoi An\'s signature noodle dish - thick noodles with pork, herbs, and crispy croutons' },
        { name: 'White Rose Dumplings', description: 'Delicate shrimp dumplings shaped like roses - invented here' },
        { name: 'Banh Mi Phuong', description: 'Anthony Bourdain declared this the best banh mi in Vietnam' },
      ],
      nature: [
        { name: 'An Bang Beach', description: 'Peaceful beach 4km from town with beach bars and seafood restaurants' },
        { name: 'Cua Dai Beach', description: 'Long sandy beach perfect for swimming and cycling from town' },
        { name: 'Basket Boat Rides', description: 'Traditional round bamboo boats in the coconut forest - learn to paddle one' },
      ],
    }
  },
  'Da Nang': {
    bestFor: ['Beach', 'Mountains', 'Adventure'],
    crowdLevel: 'Moderate',
    bestTime: 'Feb-May',
    topSites: ['Marble Mountains', 'My Khe Beach', 'Dragon Bridge', 'Ba Na Hills'],
    localTip: 'Visit Dragon Bridge on weekends at 9pm for fire-breathing show',
    avgDays: '2-3 days',
    pros: ['Beautiful beaches', 'Good base for day trips', 'Modern city'],
    cons: ['Less character than Hoi An', 'Beach can be rough', 'Hot summers'],
    ratings: { calm: 3, wow: 4, history: 2, friction: 2 },
    idealFor: ['Beach lovers', 'Families', 'Adventure seekers', 'Day trippers'],
    highlights: {
      landmarks: [
        { name: 'Marble Mountains', description: 'Five limestone hills with Buddhist temples, caves, and panoramic views' },
        { name: 'Dragon Bridge', description: 'Unique 666m bridge shaped like a dragon - breathes fire on weekend nights!' },
        { name: 'Ba Na Hills', description: 'French-built hill station with the famous Golden Bridge held by giant hands' },
        { name: 'Lady Buddha', description: 'Vietnam\'s tallest Buddha statue (67m) at Linh Ung Pagoda on Son Tra Peninsula' },
      ],
      nature: [
        { name: 'My Khe Beach', description: 'Named by Forbes as one of most attractive beaches in the world - 30km of sand' },
        { name: 'Son Tra Peninsula', description: 'Forested peninsula with wild monkeys, hidden beaches, and incredible views' },
        { name: 'Hai Van Pass', description: 'Epic coastal road made famous by Top Gear - rent a motorbike and drive it' },
      ],
      food: [
        { name: 'Mi Quang', description: 'Da Nang\'s signature turmeric noodles with pork, shrimp, and crunchy rice crackers' },
        { name: 'Banh Trang Cuon Thit Heo', description: 'Fresh rice paper rolls with pork belly and herbs - DIY style' },
        { name: 'Seafood Street', description: 'An Thuong area has dozens of restaurants with tanks of live seafood' },
      ],
    }
  },
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
