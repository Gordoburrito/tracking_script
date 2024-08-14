import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormModule, APIModule, TrackingModule } from '../script.js'

describe('FormModule', () => {
  let mockForm;

  beforeEach(() => {
    vi.resetAllMocks()
    document.createElement = vi.fn().mockReturnValue({ 
      setAttribute: vi.fn(),
      onload: null
    })
    document.head.appendChild = vi.fn()
    vi.spyOn(FormModule, 'setupFormHandling')
    vi.spyOn(APIModule, 'post').mockResolvedValue({})
    vi.spyOn(TrackingModule, 'handleEvent')
    vi.spyOn(TrackingModule, 'getTrackingData').mockReturnValue({ mockTracking: 'data' })

    // Mock form and its elements
    mockForm = {
      addEventListener: vi.fn(),
      querySelectorAll: vi.fn().mockReturnValue([]),
      querySelector: vi.fn().mockImplementation((selector) => {
        if (selector === '[name="name"]') return { id: 'name' }
        if (selector === '[name="email"]') return { id: 'email' }
        if (selector === 'label[for="name"]') return { textContent: 'Name:' }
        if (selector === 'label[for="email"]') return { textContent: 'Email:' }
        return null
      })
    }
    global.FormData = vi.fn().mockImplementation(() => ({
      entries: () => [
        ['name', 'John Doe'],
        ['email', 'john@example.com']
      ]
    }))
    global.Fuse = vi.fn().mockImplementation(() => ({
      search: vi.fn().mockReturnValue([{ item: { value: 'mocked value' } }])
    }))
  })

  it('should initialize correctly', () => {
    expect(FormModule).toBeDefined()
  })

  it('should load FuseJS and set up form handling', () => {
    FormModule.init()
    
    expect(document.createElement).toHaveBeenCalledWith('script')
    expect(document.head.appendChild).toHaveBeenCalled()
    
    const scriptElement = document.createElement.mock.results[0].value
    scriptElement.onload()
    
    expect(FormModule.setupFormHandling).toHaveBeenCalled()
  })

  it('should handle form submission correctly', () => {
    const event = { preventDefault: vi.fn(), target: mockForm }
    FormModule.handleFormSubmit(event)
    
    expect(event.preventDefault).toHaveBeenCalled()
    expect(TrackingModule.handleEvent).toHaveBeenCalledWith('form_submission')
    expect(APIModule.post).toHaveBeenCalled()
  })
})