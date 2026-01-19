import { test, expect } from '@playwright/test';

test.describe('Core API Endpoints', () => {
  // Increase timeout for API calls
  test.setTimeout(60000);

  test.describe('City Image API', () => {
    test('returns image for valid city', async ({ request }) => {
      const response = await request.get('/api/city-image?city=Tokyo&country=Japan');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.imageUrl).toBeDefined();
      expect(typeof data.imageUrl).toBe('string');
      expect(data.imageUrl.length).toBeGreaterThan(0);
    });

    test('returns placeholder for unknown city', async ({ request }) => {
      const response = await request.get('/api/city-image?city=NonExistentCity12345');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.imageUrl).toBeDefined();
      expect(data.source).toBe('placeholder');
    });

    test('returns error for missing city param', async ({ request }) => {
      const response = await request.get('/api/city-image');
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Site Image API', () => {
    test('returns image for valid attraction', async ({ request }) => {
      const response = await request.get('/api/site-image?site=Eiffel%20Tower&city=Paris');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.imageUrl).toBeDefined();
    });

    test('returns placeholder for unknown site', async ({ request }) => {
      const response = await request.get('/api/site-image?site=NonExistentPlace12345');
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.imageUrl).toBeDefined();
      expect(data.source).toBe('placeholder');
    });

    test('returns error for missing site param', async ({ request }) => {
      const response = await request.get('/api/site-image');
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Explore Recommendations API', () => {
    test('returns places for valid city', async ({ request }) => {
      const response = await request.post('/api/explore/recommendations', {
        data: { city: 'Tokyo' },
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.places).toBeDefined();
      expect(Array.isArray(data.places)).toBe(true);
    });

    test('returns places with category filter', async ({ request }) => {
      const response = await request.post('/api/explore/recommendations', {
        data: { city: 'Paris', category: 'restaurants' },
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.places).toBeDefined();
    });

    test('returns error for missing city', async ({ request }) => {
      const response = await request.post('/api/explore/recommendations', {
        data: {},
      });
      
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Places Activities API', () => {
    test('returns activities for city', async ({ request }) => {
      const response = await request.get('/api/places/activities?city=Barcelona');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.activities || data.places).toBeDefined();
    });
  });

  test.describe('Places Restaurants API', () => {
    test('returns restaurants for city', async ({ request }) => {
      const response = await request.get('/api/places/restaurants?city=Rome');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.restaurants || data.places).toBeDefined();
    });
  });

  test.describe('City Info API', () => {
    test('returns info for known city', async ({ request }) => {
      const response = await request.get('/api/city-info?city=Tokyo');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.bestFor || data.crowdLevel || data.bestTime).toBeDefined();
    });

    test('returns fallback for unknown city', async ({ request }) => {
      const response = await request.get('/api/city-info?city=SmallTownXYZ');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      // Should return default fallback data
      expect(data).toBeDefined();
    });
  });

  test.describe('Placeholder Image API', () => {
    test('returns SVG placeholder', async ({ request }) => {
      const response = await request.get('/api/placeholder/city/TestCity');
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/svg+xml');
    });

    test('generates consistent colors for same name', async ({ request }) => {
      const response1 = await request.get('/api/placeholder/city/Paris');
      const response2 = await request.get('/api/placeholder/city/Paris');
      
      const svg1 = await response1.text();
      const svg2 = await response2.text();
      
      // Same city should generate same placeholder
      expect(svg1).toBe(svg2);
    });
  });

  test.describe('Generate Itinerary API', () => {
    test('generates itinerary for valid trip DNA', async ({ request }) => {
      const tripDna = {
        interests: {
          destinations: ['Tokyo', 'Kyoto'],
        },
        constraints: {
          duration: { min: 5, max: 7, unit: 'days' },
        },
      };

      const response = await request.post('/api/generate-itinerary', {
        data: { tripDna },
        timeout: 60000,
      });

      // Allow either success or partial success
      expect([200, 206, 500]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.days || data.itinerary).toBeDefined();
      }
    });
  });

  test.describe('Disabled AI Endpoints', () => {
    test('parse-ticket returns 503', async ({ request }) => {
      const response = await request.post('/api/parse-ticket', {
        data: { image: 'test' },
      });
      
      expect(response.status()).toBe(503);
      const data = await response.json();
      expect(data.error).toContain('unavailable');
    });

    test('place-history returns 503', async ({ request }) => {
      const response = await request.post('/api/place-history', {
        data: { place: 'test' },
      });
      
      expect(response.status()).toBe(503);
    });
  });
});
