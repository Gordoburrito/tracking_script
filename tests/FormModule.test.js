import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormModule } from '../script.js'

describe('FormModule', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Mock document.createElement and appendChild
    document.createElement = vi.fn().mockReturnValue({ 
      setAttribute: vi.fn(),
      onload: null
    })
    document.head.appendChild = vi.fn()
    vi.spyOn(FormModule, 'setupFormHandling')
  })

  it('should load FuseJS and set up form handling', () => {
    FormModule.init()
    
    // Check if script element was created
    expect(document.createElement).toHaveBeenCalledWith('script')
    
    // Check if script was appended to head
    expect(document.head.appendChild).toHaveBeenCalled()
    
    // Simulate script load
    const scriptElement = document.createElement.mock.results[0].value
    scriptElement.onload()
    
    // Check if setupFormHandling was called (you might need to spy on this method)
    expect(FormModule.setupFormHandling).toHaveBeenCalled()
  })

  it.todo('should handle form submission correctly')
  it.todo('should process and submit form data to API')
  it.todo('should correctly extract form data array')
  it.todo('should clean label text properly')
  it.todo('should create a working fuzzy matcher')
  it.todo('should extract lead data correctly using fuzzy matching')
})