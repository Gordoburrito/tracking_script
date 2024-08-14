import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TelecomModule, APIModule, TrackingModule } from '../script.js'

describe('TelecomModule', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(document.body, 'addEventListener')
  })

  it('should initialize and set up click event listener', () => {
    TelecomModule.init()
    expect(document.body.addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function)
    )
  })
  
  it('should handle tel link clicks correctly', () => {
    // Create a mock tel link
    const telLink = document.createElement('a');
    telLink.href = 'tel:+1234567890';
    document.body.appendChild(telLink);

    // Mock the APIModule.post method
    const mockPost = vi.fn().mockResolvedValue({});
    vi.spyOn(APIModule, 'post').mockImplementation(mockPost);

    // Mock the TrackingModule.getTrackingData method
    const mockTrackingData = { someData: 'test' };
    vi.spyOn(TrackingModule, 'getTrackingData').mockReturnValue(mockTrackingData);

    // Initialize the TelecomModule
    TelecomModule.init();

    // Simulate a click on the tel link
    telLink.click();

    // Assert that APIModule.post was called with the correct parameters
    expect(mockPost).toHaveBeenCalledWith('/api/v1/telecom_clicks', {
      phone: '+1234567890',
      trackingHistory: mockTrackingData,
      href_type: 'tel',
      website: window.location.href
    });

    // Clean up
    document.body.removeChild(telLink);
  })
  
  it('should handle sms link clicks correctly', () => {
    const smsLink = document.createElement('a')
    smsLink.href = "sms:+1234567890"
    document.body.appendChild(smsLink)

    const mockPost = vi.fn().mockResolvedValue({})
    vi.spyOn(APIModule, "post").mockImplementation(mockPost)

    const mockTrackingData = { someData: 'sms_test' }
    vi.spyOn(TrackingModule, 'getTrackingData').mockReturnValue(mockTrackingData)

    TelecomModule.init();

    smsLink.click();

    expect(mockPost).toHaveBeenCalledWith('/api/v1/telecom_clicks', {
      phone: '+1234567890',
      trackingHistory: mockTrackingData,
      href_type: 'sms',
      website: window.location.href
    });

    document.body.removeChild(smsLink)
  })

  it('should ignore non-telecom links', () => {
    // Create a non-telecom link
    const regularLink = document.createElement('a')
    regularLink.href = "https://example.com"
    document.body.appendChild(regularLink)

    // Mock the APIModule.post method
    const mockPost = vi.fn().mockResolvedValue({})
    vi.spyOn(APIModule, 'post').mockImplementation(mockPost)

    // Initialize the TelecomModule
    TelecomModule.init()

    // Simulate a click on the regular link
    regularLink.click()

    // Assert that APIModule.post was not called
    expect(mockPost).not.toHaveBeenCalled()

    // Clean up
    document.body.removeChild(regularLink)
  })

  it('should send correct data to API on telecom link click', async () => {
    // Mock the window.location
    const mockLocation = new URL('https://example.com/test-page');
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });

    // Create a mock telecom link
    const telLink = document.createElement('a');
    telLink.href = 'tel:+1234567890';
    document.body.appendChild(telLink);

    // Mock the APIModule.post method
    const mockPost = vi.fn().mockResolvedValue({});
    vi.spyOn(APIModule, 'post').mockImplementation(mockPost);

    // Mock the TrackingModule.getTrackingData method
    const mockTrackingData = { someSessionId: { sessionData: 'test' } };
    vi.spyOn(TrackingModule, 'getTrackingData').mockReturnValue(mockTrackingData);

    // Initialize the TelecomModule
    TelecomModule.init();

    // Simulate a click on the tel link
    await telLink.click();

    // Assert that APIModule.post was called with the correct parameters
    expect(mockPost).toHaveBeenCalledWith('/api/v1/telecom_clicks', {
      phone: '+1234567890',
      trackingHistory: mockTrackingData,
      href_type: 'tel',
      website: 'https://example.com/test-page'
    });

    // Clean up
    document.body.removeChild(telLink);
  });
})