// Weather utilities using Open-Meteo API (free, no API key required)

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  humidity: number;
  location: string;
}

// Geocoding to get coordinates from city name
async function getCoordinates(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
        name: result.name,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Weather code to condition and icon mapping
function getWeatherCondition(code: number): { condition: string; icon: string } {
  // WMO Weather interpretation codes
  const conditions: Record<number, { condition: string; icon: string }> = {
    0: { condition: 'Clear', icon: '☀️' },
    1: { condition: 'Mainly Clear', icon: '🌤️' },
    2: { condition: 'Partly Cloudy', icon: '⛅' },
    3: { condition: 'Overcast', icon: '☁️' },
    45: { condition: 'Foggy', icon: '🌫️' },
    48: { condition: 'Icy Fog', icon: '🌫️' },
    51: { condition: 'Light Drizzle', icon: '🌧️' },
    53: { condition: 'Drizzle', icon: '🌧️' },
    55: { condition: 'Heavy Drizzle', icon: '🌧️' },
    61: { condition: 'Light Rain', icon: '🌧️' },
    63: { condition: 'Rain', icon: '🌧️' },
    65: { condition: 'Heavy Rain', icon: '🌧️' },
    71: { condition: 'Light Snow', icon: '🌨️' },
    73: { condition: 'Snow', icon: '🌨️' },
    75: { condition: 'Heavy Snow', icon: '🌨️' },
    77: { condition: 'Snow Grains', icon: '🌨️' },
    80: { condition: 'Light Showers', icon: '🌦️' },
    81: { condition: 'Showers', icon: '🌦️' },
    82: { condition: 'Heavy Showers', icon: '🌦️' },
    85: { condition: 'Light Snow Showers', icon: '🌨️' },
    86: { condition: 'Snow Showers', icon: '🌨️' },
    95: { condition: 'Thunderstorm', icon: '⛈️' },
    96: { condition: 'Thunderstorm w/ Hail', icon: '⛈️' },
    99: { condition: 'Thunderstorm w/ Heavy Hail', icon: '⛈️' },
  };

  return conditions[code] || { condition: 'Unknown', icon: '🌡️' };
}

// Fetch weather data for a city
export async function fetchWeather(city: string): Promise<WeatherData | null> {
  try {
    // First get coordinates
    const coords = await getCoordinates(city);
    if (!coords) return null;

    // Fetch current weather
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
    );
    const data = await response.json();

    if (!data.current) return null;

    const { condition, icon } = getWeatherCondition(data.current.weather_code);

    return {
      temperature: Math.round(data.current.temperature_2m),
      condition,
      icon,
      high: Math.round(data.daily?.temperature_2m_max?.[0] || data.current.temperature_2m),
      low: Math.round(data.daily?.temperature_2m_min?.[0] || data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      location: coords.name,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}
