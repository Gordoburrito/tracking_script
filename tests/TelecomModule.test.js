import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TelecomModule } from '../script.js'

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
  
  it.todo('should handle tel link clicks correctly')
  it.todo('should handle sms link clicks correctly')
  it.todo('should ignore non-telecom links')
  it.todo('should send correct data to API on telecom link click')
})