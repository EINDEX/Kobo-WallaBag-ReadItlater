import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import app from '../index';
import { HoarderClient } from '../lib/hoarderClient';

// Load environment variables
const HOARDER_URL = process.env.HOARDER_URL!;
const HOARDER_API_KEY = process.env.HOARDER_API_KEY!;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;

describe('API E2E Tests', () => {
  let testArticleId: string;

  // Helper function to make authenticated requests
  const makeRequest = async (path: string, options: RequestInit = {}) => {
    try {
      const url = new URL(path, 'http://localhost');
      url.searchParams.append('access_token', ACCESS_TOKEN);
      
      console.log(`Making request to: ${url.toString()}`);
      
      // Create a request with bindings
      const req = new Request(url, options);
      const env = {
        HOARDER_URL,
        HOARDER_API_KEY,
        ACCESS_TOKEN
      };
      
      // Add bindings to the request context
      const response = await app.fetch(req, env);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
      }
      
      return response;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  };

  beforeAll(async () => {
    // Create a test article to use in our tests
    const client = new HoarderClient(HOARDER_URL, HOARDER_API_KEY);
    const article = await client.addLink('https://example.com');
    testArticleId = article.id.toString();
  });

  afterAll(async () => {
    // Clean up any remaining test articles
    const client = new HoarderClient(HOARDER_URL, HOARDER_API_KEY);
    try {
      await client.deleteLink(testArticleId);
    } catch (error) {
      console.log('Cleanup error (can be ignored if article was already deleted in tests):', error);
    }
  });

  describe('POST /v3/send', () => {
    it('should handle article actions', async () => {
      // First add a new article
      const addAction = {
        actions: [
          { action: 'add', url: 'https://example.org' }
        ]
      };

      const addResponse = await makeRequest('/v3/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addAction),
      });

      expect(addResponse.status).toBe(200);

      // Then test other actions
      const actions = {
        actions: [
          { action: 'archive', item_id: testArticleId },
          { action: 'favorite', item_id: testArticleId },
        ]
      };

      const response = await makeRequest('/v3/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actions),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('action_results');
      expect(Array.isArray(data.action_results)).toBe(true);
    });

    it('should handle delete action', async () => {
      const deleteAction = {
        actions: [
          { action: 'delete', item_id: testArticleId }
        ]
      };

      const response = await makeRequest('/v3/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteAction),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('action_results');
      expect(Array.isArray(data.action_results)).toBe(true);
    });
  });

  describe('POST /v3/get', () => {
    it('should fetch articles since timestamp', async () => {
      const timestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const response = await makeRequest('/v3/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ since: timestamp }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('list');
      expect(typeof data.list).toBe('object');
      expect(data).toHaveProperty('since');
      expect(typeof data.since).toBe('number');
      expect(data.since).toBeGreaterThanOrEqual(timestamp);
    });

    it('should handle invalid timestamp', async () => {
      const response = await makeRequest('/v3/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ since: 'invalid' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('list');
      expect(Array.isArray(data.list)).toBe(true);
    });
  });

  describe('POST /v3beta/text', () => {
    it('should fetch article text by URL', async () => {
      // First create a test article
      const client = new HoarderClient(HOARDER_URL, HOARDER_API_KEY);
      const article = await client.addLink('https://example.com/test');
      const testUrl = `https://example.com#${article.id}`;

      const formData = new FormData();
      formData.append('url', testUrl);

      const response = await makeRequest('/v3beta/text', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('article');
      expect(data.article).toHaveProperty('text');
      expect(typeof data.article.text).toBe('string');
    });

    it('should handle invalid URL format', async () => {
      const formData = new FormData();
      formData.append('url', 'invalid-url');

      const response = await makeRequest('/v3beta/text', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('article');
    });
  });
});