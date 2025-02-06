import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HoarderClient } from '../lib/hoarderClient'

describe('HoarderClient', () => {
  let client: HoarderClient
  const mockApiKey = 'test-api-key'
  const mockApiUrl = 'https://api.hoarder.app'

  beforeEach(() => {
    client = new HoarderClient(mockApiUrl, mockApiKey)
    // Reset fetch mock between tests
    vi.resetAllMocks()
  })

  describe('fetchPages', () => {
    it('should fetch articles with correct parameters', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Test Article',
            url: 'https://example.com',
            content: 'Test content',
            created_at: '2024-02-05T10:00:00Z',
            updated_at: '2024-02-05T10:00:00Z',
            archived: false,
            favorite: false,
            tags: ['test']
          }
        ]
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await client.fetchPages(1612345678)

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/bookmarks?since=1612345678`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('fetchPage', () => {
    it('should fetch a single article by id', async () => {
      const mockResponse = {
        data: {
          id: '1',
          title: 'Test Article',
          url: 'https://example.com',
          content: 'Test content',
          created_at: '2024-02-05T10:00:00Z',
          updated_at: '2024-02-05T10:00:00Z',
          archived: false,
          favorite: false,
          tags: ['test']
        }
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await client.fetchPage('1')

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/bookmarks/1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('actions', () => {
    it('should archive an article', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const result = await client.actions({ item_id: 1, action: 'archive' })

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/bookmarks/1`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ archived: true })
        }
      )
      expect(result).toBe(true)
    })

    it('should favorite an article', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const result = await client.actions({ item_id: 1, action: 'favorite' })

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/bookmarks/1`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ favorite: true })
        }
      )
      expect(result).toBe(true)
    })
  })

  describe('addLink', () => {
    it('should add a new bookmark', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const url = 'https://example.com'
      const result = await client.addLink(url)

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/bookmarks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url })
        }
      )
      expect(result).toBe(true)
    })
  })

  describe('deleteLink', () => {
    it('should delete a bookmark', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const result = await client.deleteLink('1')

      expect(fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/bookmarks/1`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      expect(result).toBe(true)
    })
  })
})