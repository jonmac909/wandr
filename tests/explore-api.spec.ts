import { test, expect } from '@playwright/test';

test.describe('Explore API', () => {
  test.setTimeout(60000);

  test('recommendations endpoint returns places for Tokyo', async ({ request }) => {
    const response = await request.post('/api/explore/recommendations', {
      timeout: 60000,
      data: {
        city: 'Tokyo',
      },
    });

    console.log('Status:', response.status());
    const body = await response.json();
    console.log('Response:', JSON.stringify(body, null, 2).slice(0, 500));

    expect(response.status()).toBe(200);
    expect(body.places).toBeDefined();
    expect(Array.isArray(body.places)).toBe(true);
    
    if (body.places.length > 0) {
      // Check structure of returned places
      const place = body.places[0];
      expect(place.id).toBeDefined();
      expect(place.name).toBeDefined();
      expect(typeof place.rating).toBe('number');
    }
  });

  test('recommendations with category filter', async ({ request }) => {
    const response = await request.post('/api/explore/recommendations', {
      timeout: 60000,
      data: {
        city: 'Paris',
        category: 'restaurants',
      },
    });

    console.log('Status:', response.status());
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.places).toBeDefined();
  });

  test('recommendations with cafes category', async ({ request }) => {
    const response = await request.post('/api/explore/recommendations', {
      timeout: 60000,
      data: {
        city: 'London',
        category: 'cafes',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.places).toBeDefined();
  });

  test('recommendations returns error for missing city', async ({ request }) => {
    const response = await request.post('/api/explore/recommendations', {
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});
