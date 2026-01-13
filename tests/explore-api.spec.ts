import { test, expect } from '@playwright/test';

test.describe('Explore API', () => {
  test('recommendations endpoint returns places for Tokyo', async ({ request }) => {
    const response = await request.post('/api/explore/recommendations', {
      data: {
        city: 'Tokyo',
      },
    });

    console.log('Status:', response.status());
    const body = await response.json();
    console.log('Response:', JSON.stringify(body, null, 2));

    // Log the error if present
    if (body.error) {
      console.log('ERROR:', body.error);
    }

    expect(response.status()).toBe(200);
    expect(body.places).toBeDefined();
    expect(body.places.length).toBeGreaterThan(0);
  });

  test('recommendations with category filter', async ({ request }) => {
    const response = await request.post('/api/explore/recommendations', {
      data: {
        city: 'Tokyo',
        category: 'cafe',
      },
    });

    console.log('Status:', response.status());
    const body = await response.json();
    console.log('Response:', JSON.stringify(body, null, 2));

    if (body.error) {
      console.log('ERROR:', body.error);
    }
  });
});
