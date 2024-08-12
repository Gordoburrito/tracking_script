import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIModule } from '../script.js'

// Mock fetch
global.fetch = vi.fn()

describe('APIModule', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should initialize with a token', () => {
    APIModule.init('test_token')
    expect(APIModule.token).toBe('test_token')
  })

  it.todo('should make a successful POST request')
  it.todo('should handle errors in POST request')
  it.todo('should log warnings when response contains a message')
})