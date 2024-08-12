import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CRM, APIModule, FormModule, TelecomModule } from '../script.js'

describe('CRM', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(APIModule, 'init').mockImplementation(() => {})
    vi.spyOn(FormModule, 'init').mockImplementation(() => {})
    vi.spyOn(TelecomModule, 'init').mockImplementation(() => {})
  })

  it('should initialize all modules correctly', () => {
    const mockConfig = { token: 'test-token' }
    CRM.init(mockConfig)
    expect(APIModule.init).toHaveBeenCalledWith('test-token')
    expect(FormModule.init).toHaveBeenCalled()
    expect(TelecomModule.init).toHaveBeenCalled()
  })

  it('should pass the correct token to APIModule', () => {
    const mockConfig = { token: 'test-token' }
    CRM.init(mockConfig)
    expect(APIModule.init).toHaveBeenCalledWith('test-token')
  })
})