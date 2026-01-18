'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, MapPin, Clock, Lightbulb, Camera, Mountain, Utensils, Heart, ChevronRight, Search, Bookmark, Map, Coffee, Landmark, Star, TrendingUp } from 'lucide-react';

export default function ExploreTab() {
    const router = useRouter();
    const [selectedDestination, setSelectedDestination] = useState('thailand');
    const [savedItems, setSavedItems] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        geography: false,
        history: false
    });

    const destinations: Record<string, any> = {
        thailand: {
            name: 'Thailand',
            description: 'Thailand is a Southeast Asian country. It\'s known for tropical beaches, opulent royal palaces, ancient ruins and ornate temples displaying figures of Buddha. In Bangkok, the capital, an ultramodern cityscape rises next to quiet canalside communities and the iconic temples of Wat Arun, Wat Pho and the Emerald Buddha Temple (Wat Phra Kaew). Nearby beach resorts include bustling Pattaya and fashionable Hua Hin.',
            mapImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&h=400&fit=crop',
            activities: [
                { id: 1, name: 'Visit Grand Palace', type: 'activity', location: 'Bangkok', icon: Landmark, desc: 'Explore Thailand\'s most famous landmark with stunning architecture', rating: 4.8 },
                { id: 2, name: 'Phi Phi Islands Tour', type: 'activity', location: 'Phuket', icon: Mountain, desc: 'Stunning limestone cliffs and crystal clear waters', rating: 4.9 },
                { id: 3, name: 'Thai Cooking Class', type: 'activity', location: 'Chiang Mai', icon: Utensils, desc: 'Learn to make authentic Pad Thai and Green Curry', rating: 4.7 },
                { id: 4, name: 'Floating Markets', type: 'activity', location: 'Bangkok', icon: Camera, desc: 'Traditional market experience on the water', rating: 4.6 },
                { id: 5, name: 'Elephant Sanctuary', type: 'activity', location: 'Chiang Mai', icon: Heart, desc: 'Ethical elephant interaction and feeding', rating: 4.9 },
                { id: 6, name: 'Railay Beach Climbing', type: 'activity', location: 'Krabi', icon: Mountain, desc: 'World-class rock climbing on limestone cliffs', rating: 4.8 }
            ],
            restaurants: [
                { id: 7, name: 'Jay Fai', type: 'restaurant', location: 'Bangkok', icon: Utensils, desc: 'Michelin-starred crab omelet and drunken noodles', cuisine: 'Thai', price: '$$$', rating: 4.7 },
                { id: 8, name: 'Gaggan Anand', type: 'restaurant', location: 'Bangkok', icon: Utensils, desc: 'Progressive Indian cuisine with molecular gastronomy', cuisine: 'Indian', price: '$$$$', rating: 4.9 },
                { id: 9, name: 'Somtum Der', type: 'restaurant', location: 'Bangkok', icon: Utensils, desc: 'Authentic Isaan cuisine and papaya salad', cuisine: 'Thai', price: '$$', rating: 4.6 },
                { id: 10, name: 'Thip Samai', type: 'restaurant', location: 'Bangkok', icon: Utensils, desc: 'Best Pad Thai in Bangkok since 1966', cuisine: 'Thai', price: '$', rating: 4.5 },
                { id: 11, name: 'Supanniga Eating Room', type: 'restaurant', location: 'Bangkok', icon: Utensils, desc: 'Traditional Thai dishes with river views', cuisine: 'Thai', price: '$$', rating: 4.7 }
            ],
            cities: [
                { id: 12, name: 'Bangkok', type: 'city', icon: MapPin, desc: 'Vibrant capital with 400+ temples and legendary street food scene', highlights: '500+ temples, street food paradise', population: '10.5M' },
                { id: 13, name: 'Chiang Mai', type: 'city', icon: MapPin, desc: 'Cultural hub in the mountains with night markets and ancient temples', highlights: 'Old City, night bazaars', population: '1.2M' },
                { id: 14, name: 'Phuket', type: 'city', icon: MapPin, desc: 'Beach paradise and gateway to the Andaman islands', highlights: 'Beaches, diving, nightlife', population: '600K' },
                { id: 15, name: 'Ayutthaya', type: 'city', icon: MapPin, desc: 'Ancient capital with UNESCO World Heritage ruins', highlights: 'Historical temples', population: '800K' }
            ],
            cityImages: [
                { name: 'Bangkok', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop', famousFor: 'Famous for its ornate shrines, vibrant street life, and legendary street food scene with over 400 temples' },
                { name: 'Chiang Mai', image: 'https://images.unsplash.com/photo-1598973281627-8753faa8a621?w=400&h=300&fit=crop', famousFor: 'Known for ancient temples within the old city walls, night bazaars, and elephant sanctuaries in the mountains' },
                { name: 'Phuket', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop', famousFor: 'Thailand\'s largest island, renowned for pristine beaches, world-class diving spots, and vibrant nightlife' },
                { name: 'Ayutthaya', image: 'https://images.unsplash.com/photo-1563492065526-9c0c2f1a7c64?w=400&h=300&fit=crop', famousFor: 'UNESCO World Heritage site with magnificent temple ruins from the ancient Siamese kingdom (1350-1767)' }
            ],
            tips: [
                'Learn basic phrases: "Sawasdee" (hello), "Khop khun" (thank you)',
                'Dress modestly when visiting temples - cover shoulders and knees',
                'Always carry small bills - street vendors often don\'t have change',
                'Remove shoes before entering homes and temples',
                'Book trains and buses in advance during peak season (Nov-Feb)'
            ],
            geography: {
                location: 'Southeast Asia, Gulf of Thailand and Andaman Sea',
                climate: 'Tropical with three seasons: hot, rainy, and cool',
                terrain: 'Central plains, northeastern plateau, mountainous north, southern peninsula',
                mapImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=500&fit=crop',
                fullDescription: 'Thailand is located in the heart of Southeast Asia, bordered by Myanmar to the west and north, Laos to the north and east, Cambodia to the southeast, and Malaysia to the south. The country covers approximately 513,120 square kilometers and features diverse geography. The central region is dominated by the fertile Chao Phraya River valley, Thailand\'s agricultural heartland. The northeastern Isan plateau is characterized by rolling hills and the Mekong River border. Northern Thailand is mountainous with peaks reaching over 2,500 meters, while the southern peninsula features tropical beaches along both the Gulf of Thailand and Andaman Sea coastlines.'
            },
            history: 'Thailand has never been colonized, maintaining independence throughout history. The current Chakri dynasty was established in 1782, and Thailand transitioned to constitutional monarchy in 1932.',
            fullHistory: [
                {
                    period: 'Ancient Kingdoms (6th-13th centuries)',
                    description: 'Early civilizations like Dvaravati laid the foundation for Thai culture and Buddhism.'
                },
                {
                    period: 'Sukhothai Kingdom (1238-1438)',
                    description: 'First true Thai kingdom. Created Thai script and established Buddhism as central to identity.'
                },
                {
                    period: 'Ayutthaya Kingdom (1351-1767)',
                    description: 'Golden age of Thai power and culture. Extensive trade with Europe and Asia until destroyed by Burma.'
                },
                {
                    period: 'Chakri Dynasty (1782-present)',
                    description: 'Current royal dynasty founded by King Rama I. Established Bangkok as capital and modernized Thailand.'
                },
                {
                    period: 'Colonial Era (19th century)',
                    description: 'Only Southeast Asian country never colonized. Kings skillfully negotiated with European powers.'
                },
                {
                    period: 'Constitutional Monarchy (1932-present)',
                    description: 'Bloodless revolution transformed government. Periods of democracy mixed with military rule continue today.'
                }
            ]
        },
        japan: {
            name: 'Japan',
            description: 'Japan is an island nation in East Asia where ancient tradition meets futuristic innovation. From the neon-lit streets of Tokyo to the serene temples of Kyoto, Japan offers a unique blend of ultramodern cities and traditional culture.',
            mapImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop',
            activities: [
                { id: 16, name: 'Climb Mount Fuji', type: 'activity', location: 'Fuji', icon: Mountain, desc: 'Summit Japan\'s sacred peak (July-Sept only)', rating: 4.8 },
                { id: 17, name: 'Fushimi Inari Shrine', type: 'activity', location: 'Kyoto', icon: Landmark, desc: 'Walk through 10,000 vermillion torii gates', rating: 4.9 },
                { id: 18, name: 'TeamLab Borderless', type: 'activity', location: 'Tokyo', icon: Camera, desc: 'Immersive digital art museum experience', rating: 4.7 },
                { id: 19, name: 'Onsen Experience', type: 'activity', location: 'Hakone', icon: Heart, desc: 'Traditional hot spring bathing with Mount Fuji views', rating: 4.9 }
            ],
            restaurants: [
                { id: 20, name: 'Sukiyabashi Jiro', type: 'restaurant', location: 'Tokyo', icon: Utensils, desc: '3 Michelin stars, legendary sushi experience', cuisine: 'Sushi', price: '$$$$', rating: 4.9 },
                { id: 21, name: 'Ichiran Ramen', type: 'restaurant', location: 'Tokyo', icon: Utensils, desc: 'Solo dining ramen booths, perfect tonkotsu', cuisine: 'Ramen', price: '$', rating: 4.6 },
                { id: 22, name: 'Narisawa', type: 'restaurant', location: 'Tokyo', icon: Utensils, desc: '2 Michelin stars, innovative Japanese cuisine', cuisine: 'Japanese', price: '$$$$', rating: 4.8 }
            ],
            cities: [
                { id: 23, name: 'Tokyo', type: 'city', icon: MapPin, desc: 'Electric metropolis mixing tradition and cutting-edge technology', highlights: 'Shibuya, Shinjuku, Asakusa', population: '14M' },
                { id: 24, name: 'Kyoto', type: 'city', icon: MapPin, desc: 'Ancient capital with 2,000 temples and traditional geisha culture', highlights: '2,000 temples, cultural heritage', population: '1.5M' },
                { id: 25, name: 'Osaka', type: 'city', icon: MapPin, desc: 'Food capital known for takoyaki, okonomiyaki, and vibrant nightlife', highlights: 'Street food, Dotonbori', population: '2.7M' }
            ],
            cityImages: [
                { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop', famousFor: 'Famous for cutting-edge technology, Shibuya crossing, ancient temples, and Michelin-starred dining' },
                { name: 'Kyoto', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop', famousFor: 'Known for 2,000 temples and shrines, traditional geisha districts, and stunning bamboo forests' },
                { name: 'Osaka', image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&h=300&fit=crop', famousFor: 'Japan\'s kitchen with amazing street food, Osaka Castle, and the vibrant Dotonbori entertainment district' }
            ],
            tips: [
                'Get a JR Pass for unlimited train travel (must buy before arriving)',
                'Carry cash - many places don\'t accept cards',
                'Bow when greeting - it\'s a sign of respect',
                'Don\'t tip - it can be considered rude',
                'Follow onsen etiquette - wash thoroughly before entering the bath'
            ],
            geography: {
                location: 'East Asia, Pacific Ocean, 4 main islands',
                climate: 'Four distinct seasons with humid summers',
                terrain: '73% mountainous with volcanic peaks',
                mapImage: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=500&fit=crop',
                fullDescription: 'Japan is an archipelago of 6,852 islands in the Pacific Ocean, with the four main islands being Honshu, Hokkaido, Kyushu, and Shikoku. The country stretches over 3,000 kilometers from northeast to southwest. About 73% of Japan is mountainous, with the Japanese Alps running through the center of Honshu. Mount Fuji (3,776m) is the highest peak and an active volcano. The country sits on the Pacific Ring of Fire, experiencing frequent earthquakes and volcanic activity. Japan has limited arable land, with most cities concentrated in coastal plains. The climate varies from humid continental in the north to humid subtropical in the south, with four distinct seasons throughout most of the country.'
            },
            history: 'Japan has a rich history from ancient samurai warriors to post-WWII economic miracle. The Meiji Restoration (1868) modernized the nation while preserving cultural identity.',
            fullHistory: [
                {
                    period: 'Ancient Japan (14,000 BCE - 300 CE)',
                    description: 'Jomon pottery culture and Yayoi rice farming laid foundations. Imperial lineage established.'
                },
                {
                    period: 'Feudal Era (1185-1603)',
                    description: 'Samurai warrior class rose to power. Period of civil wars and cultural development.'
                },
                {
                    period: 'Edo Period (1603-1868)',
                    description: '250 years of peace and isolation. Japanese culture flourished under Tokugawa shogunate.'
                },
                {
                    period: 'Meiji Restoration (1868-1912)',
                    description: 'Rapid modernization from feudal to industrial nation. Japan became a world power.'
                },
                {
                    period: 'World War II (1941-1945)',
                    description: 'Imperial expansion ended in devastating defeat and atomic bombings of Hiroshima and Nagasaki.'
                },
                {
                    period: 'Post-War to Present (1945-now)',
                    description: 'Economic miracle made Japan world\'s 2nd largest economy. Today faces aging population challenges.'
                }
            ]
        }
    };

    const toggleSection = (section: 'geography' | 'history') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const dest = destinations[selectedDestination];

    // Filter content based on search query
    const filteredContent = useMemo(() => {
        if (!searchQuery.trim()) {
            return {
                activities: dest.activities,
                restaurants: dest.restaurants,
                cities: dest.cities,
                cityImages: dest.cityImages,
            };
        }

        const query = searchQuery.toLowerCase();
        return {
            activities: dest.activities.filter((item: { name: string; desc: string; location: string }) =>
                item.name.toLowerCase().includes(query) ||
                item.desc.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query)
            ),
            restaurants: dest.restaurants.filter((item: { name: string; desc: string; location: string; cuisine: string }) =>
                item.name.toLowerCase().includes(query) ||
                item.desc.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query) ||
                item.cuisine.toLowerCase().includes(query)
            ),
            cities: dest.cities.filter((item: { name: string; desc: string; highlights: string }) =>
                item.name.toLowerCase().includes(query) ||
                item.desc.toLowerCase().includes(query) ||
                item.highlights.toLowerCase().includes(query)
            ),
            cityImages: dest.cityImages.filter((item: { name: string; famousFor: string }) =>
                item.name.toLowerCase().includes(query) ||
                item.famousFor.toLowerCase().includes(query)
            ),
        };
    }, [dest, searchQuery]);

    const toggleSave = (id: number) => {
        setSavedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const SaveButton = ({ id }: { id: number }) => {
        const isSaved = savedItems.has(id);

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(id);
                }}
                className={`p-2 rounded-lg transition-all hover:scale-110 ${isSaved
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
            >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="text-slate-700 hover:text-slate-900"
                        >
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900">Explore</h1>
                        <div className="flex-1 max-w-md ml-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search in ${dest.name}...`}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Destination Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {Object.keys(destinations).map(key => (
                        <button
                            key={key}
                            onClick={() => setSelectedDestination(key)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${selectedDestination === key
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {destinations[key].name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div>
                        {/* Destination Header */}
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">{dest.name}</h2>
                        <p className="text-slate-600 leading-relaxed mb-6">{dest.description}</p>

                        {/* Geography Quick Facts */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl overflow-hidden mb-6">
                            <button
                                onClick={() => toggleSection('geography')}
                                className="w-full p-4 flex items-center justify-between hover:bg-emerald-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-emerald-600" />
                                    <h3 className="font-bold text-slate-900">Geography</h3>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-emerald-600 transition-transform ${expandedSections.geography ? 'rotate-90' : ''}`} />
                            </button>

                            <div className="px-4 pb-4">
                                <div className="space-y-2 text-sm mb-3">
                                    <p className="text-slate-700"><span className="font-semibold">Location:</span> {dest.geography.location}</p>
                                    <p className="text-slate-700"><span className="font-semibold">Climate:</span> {dest.geography.climate}</p>
                                    <p className="text-slate-700"><span className="font-semibold">Terrain:</span> {dest.geography.terrain}</p>
                                </div>

                                {expandedSections.geography && (
                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="rounded-lg overflow-hidden border border-emerald-200">
                                            <img
                                                src={dest.geography.mapImage}
                                                alt={`${dest.name} geography`}
                                                className="w-full h-64 object-cover"
                                            />
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {dest.geography.fullDescription}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* History & Culture */}
                        <div className="bg-amber-50 border border-amber-100 rounded-xl overflow-hidden mb-6">
                            <button
                                onClick={() => toggleSection('history')}
                                className="w-full p-4 flex items-center justify-between hover:bg-amber-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-bold text-slate-900">History & Culture</h3>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-amber-600 transition-transform ${expandedSections.history ? 'rotate-90' : ''}`} />
                            </button>

                            <div className="px-4 pb-4">
                                <p className="text-sm text-slate-700">{dest.history}</p>

                                {expandedSections.history && (
                                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {dest.fullHistory.map((era: any, i: number) => (
                                            <div key={i} className="border-l-4 border-amber-400 pl-4 py-2">
                                                <h4 className="font-bold text-slate-900 text-sm mb-1">{era.period}</h4>
                                                <p className="text-sm text-slate-700 leading-relaxed">{era.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Explore Cities */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-900">Explore cities</h3>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">See all</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {filteredContent.cityImages.map((city: any, i: number) => (
                                    <div key={i} className="group cursor-pointer">
                                        <div className="relative rounded-xl overflow-hidden mb-2 shadow-md">
                                            <img src={city.image} alt={city.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <h4 className="font-bold text-white text-lg mb-1">{city.name}</h4>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{city.famousFor}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Essential Tips */}
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-bold text-slate-900">Essential Tips</h3>
                            </div>
                            <div className="space-y-2.5">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {dest.tips.map((tip: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <div className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Map & Browse */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        {/* Map */}
                        <div className="rounded-xl overflow-hidden mb-6 shadow-lg border border-slate-200">
                            <div className="relative">
                                <img src={dest.mapImage} alt={`${dest.name} map`} className="w-full h-64 object-cover" />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button className="p-2 bg-white rounded-lg shadow-md hover:bg-slate-50">
                                        <Map className="w-5 h-5 text-slate-700" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Browse Sections */}
                        <div className="space-y-5">
                            {/* Cities */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-slate-700" />
                                    Cities to explore
                                </h3>
                                <div className="space-y-2.5">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {filteredContent.cities.map((city: any) => (
                                        <div key={city.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{city.name}</h4>
                                                    <p className="text-sm text-slate-600 mb-2 leading-relaxed">{city.desc}</p>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">{city.population}</span>
                                                        <span className="text-slate-500">{city.highlights}</span>
                                                    </div>
                                                </div>
                                                <SaveButton id={city.id} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Activities */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-slate-700" />
                                    Top activities & attractions
                                </h3>
                                <div className="space-y-2.5">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {filteredContent.activities.map((activity: any) => (
                                        <div key={activity.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex gap-3 flex-1">
                                                    <div className="p-2.5 bg-blue-50 rounded-lg self-start group-hover:bg-blue-100 transition-colors">
                                                        <activity.icon className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{activity.name}</h4>
                                                        <p className="text-sm text-slate-600 mb-2 leading-relaxed">{activity.desc}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-500">{activity.location}</span>
                                                            <span className="text-xs text-slate-400">•</span>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                <span className="text-xs font-semibold text-slate-700">{activity.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <SaveButton id={activity.id} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Restaurants */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <Utensils className="w-5 h-5 text-slate-700" />
                                    Must-try restaurants
                                </h3>
                                <div className="space-y-2.5">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {filteredContent.restaurants.map((restaurant: any) => (
                                        <div key={restaurant.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex gap-3 flex-1">
                                                    <div className="p-2.5 bg-orange-50 rounded-lg self-start group-hover:bg-orange-100 transition-colors">
                                                        <Utensils className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{restaurant.name}</h4>
                                                        <p className="text-sm text-slate-600 mb-2 leading-relaxed">{restaurant.desc}</p>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs text-slate-500">{restaurant.location}</span>
                                                            <span className="text-xs text-slate-400">•</span>
                                                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{restaurant.cuisine}</span>
                                                            <span className="text-xs text-slate-500">{restaurant.price}</span>
                                                            <span className="text-xs text-slate-400">•</span>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                                <span className="text-xs font-semibold text-slate-700">{restaurant.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <SaveButton id={restaurant.id} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
