import { test, expect } from '@playwright/test';

test('chat API key check', async ({ request }) => {
  // Simple test to see if chat API has the key configured
  const response = await request.post('/api/chat/general', {
    data: {
      messages: [{ role: 'user', content: 'Hi' }],
    },
  });

  console.log('Chat API Status:', response.status());

  // If it's 401, the key is not configured
  // If it's 200 or streaming, the key IS configured
  if (response.status() === 401) {
    const body = await response.text();
    console.log('Chat API Response:', body);
  }
});
