import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TrackingModule } from '../script.js'

describe('TrackingModule', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })
  
  it('TrackingModule should handle a page visit', () => {
    TrackingModule.handlePageVisit()
    const sessionStorageData = JSON.parse(sessionStorage.getItem('sessionTrackingData'))
    expect(sessionStorageData).toBeDefined()
    expect(sessionStorageData.events).toBeDefined()
  })

  it('transferSessionToLocalStorage should transfer session to local storage', () => {
    TrackingModule.handlePageVisit()
    TrackingModule.transferSessionToLocalStorage()
    const sessionStorageData = JSON.parse(sessionStorage.getItem('sessionTrackingData'))
    const localData = JSON.parse(localStorage.getItem('trackingHistory'))

    expect(sessionStorageData).toBeNull()

    expect(localData).toBeDefined()
    expect(Object.keys(localData)).toHaveLength(1)
    
    const sessionKey = Object.keys(localData)[0]
    const sessionData = localData[sessionKey]
    
    expect(sessionData).toHaveProperty('sessionData')
    expect(sessionData).toHaveProperty('sessionStart')
    expect(sessionData).toHaveProperty('sessionEnd')
    
    expect(sessionData.sessionData).toHaveProperty('sessionId')
    expect(sessionData.sessionData).toHaveProperty('trackingParams')
    expect(sessionData.sessionData).toHaveProperty('events')
    
    expect(sessionData.sessionStart).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(sessionData.sessionEnd).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('getTrackingData should return the tracking data from local storage and session storage', async () => {
    TrackingModule.handlePageVisit()
    TrackingModule.transferSessionToLocalStorage()
    // sessionData uses keys of the datetime so it will overwrite the trackingHistory if it happened at the same time
    await new Promise(resolve => setTimeout(resolve, 1))
    TrackingModule.handlePageVisit()

    const trackingData = TrackingModule.getTrackingData()

    expect(Object.keys(trackingData)).toHaveLength(2)
  })
  it.todo('should correctly set up event listeners')
  it.todo('should handle different types of events')
  it.todo('should collect initial page visit data correctly')
})