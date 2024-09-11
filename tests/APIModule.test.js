import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APIModule } from '../script.js'

// Mock fetch and console methods
global.fetch = vi.fn()
console.warn = vi.fn()
console.log = vi.fn()
console.error = vi.fn()

describe('APIModule', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    APIModule.init('test_token')
  })

  it('should use default baseUrl if not provided', () => {
    APIModule.init({ token: 'test_token' });
    expect(APIModule.baseUrl).toBe('https://api.threadcommunication.com');
  });
  
  it('should initialize with options', () => {
    const options = { token: 'test_token', baseUrl: 'https://test-api.example.com' };
    APIModule.init(options);
    expect(APIModule.token).toBe('test_token');
    expect(APIModule.baseUrl).toBe('https://test-api.example.com');
  });

  it('should make a successful POST request', async () => {
    const mockResponse = { data: 'success' };
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    });

    APIModule.init({ token: 'test_token', baseUrl: 'https://test-api.example.com' });
    const result = await APIModule.post('/test', { key: 'value' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://test-api.example.com/test',
      {
        method: 'POST',
        headers: {
          'Authorization': 'test_token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: 'value' })
      }
    );
    expect(result).toEqual(mockResponse);
    expect(console.log).toHaveBeenCalledWith('Success:', mockResponse);
  });

  it('should handle errors in POST request', async () => {
    const mockError = new Error('Network error')
    global.fetch.mockRejectedValueOnce(mockError)

    await expect(APIModule.post('/test', { key: 'value' })).rejects.toThrow('Network error')
    expect(console.error).toHaveBeenCalledWith('Error:', mockError)
  });

  it('should log warnings when response contains a message', async () => {
    const mockResponse = { message: 'Warning message', data: 'success' }
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    await APIModule.post('/test', { key: 'value' })

    expect(console.warn).toHaveBeenCalledWith('Warning message')
    expect(console.log).toHaveBeenCalledWith('Success:', mockResponse)
  })
})