import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import * as dotenv from 'dotenv'

// Make fetch available in test environment
import { fetch } from 'undici'
global.fetch = fetch as any

beforeAll(() => {
  // Load environment variables
  dotenv.config()
  
  // Verify required environment variables
  const requiredEnvVars = ['HOARDER_URL', 'HOARDER_API_KEY', 'ACCESS_TOKEN']
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }
  
  // Log environment setup for debugging
  console.log('Test environment setup complete')
  console.log('Environment variables loaded:', {
    HOARDER_URL: process.env.HOARDER_URL ? '✓' : '✗',
    HOARDER_API_KEY: process.env.HOARDER_API_KEY ? '✓' : '✗',
    ACCESS_TOKEN: process.env.ACCESS_TOKEN ? '✓' : '✗'
  })
})

afterAll(() => {
  // Cleanup any test environment needs
})

afterEach(() => {
  vi.resetAllMocks()
})