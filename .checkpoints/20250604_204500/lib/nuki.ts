/**
 * Nuki Smart Lock API Integration
 * Nuki Bridge API v1.13 & Web API v1.4
 * European smart lock solution with comprehensive access management
 */

import crypto from 'crypto'

// Nuki API Types
export interface NukiDevice {
  smartlockId: number
  accountId?: number
  name: string
  type: number // 0: Smart Lock, 2: Opener, 3: Smart Door, 4: Smart Lock 3.0 Pro
  state: number // 0: uncalibrated, 1: locked, 2: unlocking, 3: unlocked, 4: locking, 5: unlatched, 6: unlatching, 7: unlatching, 254: motor blocked, 255: undefined
  stateName: string
  batteryCharging: boolean
  batteryCharge: number
  batteryCritical: boolean
  keypadBatteryCritical: boolean
  firmwareVersion: string
  hardwareVersion: string
  operationId?: string
  serverState: number
  adminPinState: number
  virtualDevice: boolean
  deviceType: number
  creationDate: string
  updateDate: string
  timezone: number
}

export interface NukiAuth {
  id: number
  smartlockId: number
  name: string
  enabled: boolean
  remoteAllowed: boolean
  lockCount: number
  type: number // 0: app, 1: bridge, 2: fob, 3: keypad, 13: keypad code, 14: Z-key, 15: virtual
  code?: number // For keypad codes
  allowedFromDate?: string
  allowedUntilDate?: string
  allowedWeekDays?: number
  allowedFromTime?: number
  allowedUntilTime?: number
  creationDate: string
  updateDate: string
}

export interface CreateNukiAuthRequest {
  smartlockId: number
  name: string
  type: number // 13 for keypad code
  code?: number // 6-digit code for keypad
  remoteAllowed?: boolean
  allowedFromDate?: string
  allowedUntilDate?: string
  allowedWeekDays?: number // Bitmask: 1=Monday, 2=Tuesday, 4=Wednesday, etc.
  allowedFromTime?: number // Minutes from midnight
  allowedUntilTime?: number // Minutes from midnight
}

export interface NukiAction {
  action: number // 1: unlock, 2: lock, 3: unlatch, 4: lock'n'go, 5: lock'n'go with unlatch
  nowait?: boolean
}

export interface NukiLogEntry {
  id: number
  smartlockId: number
  accountId: number
  action: number
  state: number
  stateName: string
  trigger: number
  date: string
  autoUnlock: boolean
  operationId?: string
  completionStatus: number
  authId?: number
  authName?: string
  userName?: string
}

/**
 * Nuki Smart Lock Service
 * Supports both Bridge API (local) and Web API (cloud)
 */
export class NukiService {
  private webApiToken: string
  private bridgeUrl?: string
  private bridgeToken?: string

  constructor(config: {
    webApiToken: string
    bridgeUrl?: string
    bridgeToken?: string
  }) {
    this.webApiToken = config.webApiToken
    this.bridgeUrl = config.bridgeUrl
    this.bridgeToken = config.bridgeToken
  }

  /**
   * Get all smart locks from Web API
   */
  async getSmartLocks(): Promise<NukiDevice[]> {
    const response = await fetch('https://api.nuki.io/smartlock', {
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Nuki API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get specific smart lock details
   */
  async getSmartLock(smartlockId: number): Promise<NukiDevice> {
    const response = await fetch(`https://api.nuki.io/smartlock/${smartlockId}`, {
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Nuki API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Perform lock action (lock/unlock)
   */
  async performAction(smartlockId: number, action: NukiAction): Promise<{ success: boolean; operationId?: string }> {
    const response = await fetch(`https://api.nuki.io/smartlock/${smartlockId}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(action)
    })

    if (!response.ok) {
      throw new Error(`Nuki API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: response.status === 200 || response.status === 204,
      operationId: result.operationId
    }
  }

  /**
   * Get all authorizations for a smart lock
   */
  async getAuthorizations(smartlockId: number): Promise<NukiAuth[]> {
    const response = await fetch(`https://api.nuki.io/smartlock/${smartlockId}/auth`, {
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Nuki API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create new authorization (access code)
   */
  async createAuthorization(request: CreateNukiAuthRequest): Promise<NukiAuth> {
    const response = await fetch(`https://api.nuki.io/smartlock/${request.smartlockId}/auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Nuki API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update authorization
   */
  async updateAuthorization(smartlockId: number, authId: number, updates: Partial<CreateNukiAuthRequest>): Promise<NukiAuth> {
    const response = await fetch(`https://api.nuki.io/smartlock/${smartlockId}/auth/${authId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error(`Nuki API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Delete authorization
   */
  async deleteAuthorization(smartlockId: number, authId: number): Promise<boolean> {
    const response = await fetch(`https://api.nuki.io/smartlock/${smartlockId}/auth/${authId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      }
    })

    return response.ok
  }

  /**
   * Get activity log
   */
  async getActivityLog(smartlockId: number, options?: {
    fromDate?: string
    toDate?: string
    action?: number
    limit?: number
  }): Promise<NukiLogEntry[]> {
    const params = new URLSearchParams()
    if (options?.fromDate) params.append('fromDate', options.fromDate)
    if (options?.toDate) params.append('toDate', options.toDate)
    if (options?.action) params.append('action', options.action.toString())
    if (options?.limit) params.append('limit', options.limit.toString())

    const url = `https://api.nuki.io/smartlock/${smartlockId}/log?${params.toString()}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.webApiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Nuki API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Bridge API: Get device info via local bridge
   */
  async getBridgeInfo(): Promise<any> {
    if (!this.bridgeUrl || !this.bridgeToken) {
      throw new Error('Bridge configuration missing')
    }

    const response = await fetch(`${this.bridgeUrl}/info?token=${this.bridgeToken}`)
    
    if (!response.ok) {
      throw new Error(`Nuki Bridge error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Bridge API: Perform action via local bridge (faster response)
   */
  async bridgeAction(nukiId: number, action: number): Promise<{ success: boolean; batteryCritical?: boolean }> {
    if (!this.bridgeUrl || !this.bridgeToken) {
      throw new Error('Bridge configuration missing')
    }

    const response = await fetch(`${this.bridgeUrl}/lockAction?nukiId=${nukiId}&deviceType=0&action=${action}&token=${this.bridgeToken}`)
    
    if (!response.ok) {
      throw new Error(`Nuki Bridge error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      success: result.success === true,
      batteryCritical: result.batteryCritical
    }
  }

  /**
   * Generate 6-digit access code
   */
  generateAccessCode(): number {
    return Math.floor(100000 + Math.random() * 900000)
  }

  /**
   * Convert Nuki state to LockStatus enum
   */
  mapNukiStateToLockStatus(state: number): string {
    switch (state) {
      case 1: return 'LOCKED'
      case 3: return 'UNLOCKED'
      case 5: return 'UNLOCKED' // unlatched
      case 254: return 'MAINTENANCE' // motor blocked
      case 255: return 'UNKNOWN'
      default: return 'UNKNOWN'
    }
  }

  /**
   * Convert Nuki type to lock model
   */
  mapNukiTypeToModel(type: number): string {
    switch (type) {
      case 0: return 'Nuki Smart Lock 2.0'
      case 2: return 'Nuki Opener'
      case 3: return 'Nuki Smart Door'
      case 4: return 'Nuki Smart Lock 3.0 Pro'
      default: return 'Nuki Device'
    }
  }

  /**
   * Convert weekdays bitmask to human readable
   */
  mapWeekdaysBitmask(bitmask: number): string[] {
    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']
    const result: string[] = []
    
    for (let i = 0; i < 7; i++) {
      if (bitmask & (1 << i)) {
        result.push(days[i])
      }
    }
    
    return result
  }

  /**
   * Convert time in minutes to HH:MM format
   */
  mapMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
}

/**
 * Nuki configuration interface
 */
export interface NukiConfig {
  webApiToken: string
  bridgeUrl?: string
  bridgeToken?: string
  webhookUrl?: string
  isActive: boolean
}

/**
 * Factory function to create Nuki service instance
 */
export function createNukiService(config: NukiConfig): NukiService {
  return new NukiService({
    webApiToken: config.webApiToken,
    bridgeUrl: config.bridgeUrl,
    bridgeToken: config.bridgeToken
  })
}

/**
 * Nuki action constants
 */
export const NUKI_ACTIONS = {
  UNLOCK: 1,
  LOCK: 2,
  UNLATCH: 3,
  LOCK_N_GO: 4,
  LOCK_N_GO_UNLATCH: 5
} as const

/**
 * Nuki state constants
 */
export const NUKI_STATES = {
  UNCALIBRATED: 0,
  LOCKED: 1,
  UNLOCKING: 2,
  UNLOCKED: 3,
  LOCKING: 4,
  UNLATCHED: 5,
  UNLATCHING: 6,
  MOTOR_BLOCKED: 254,
  UNDEFINED: 255
} as const

/**
 * Nuki authorization types
 */
export const NUKI_AUTH_TYPES = {
  APP: 0,
  BRIDGE: 1,
  FOB: 2,
  KEYPAD: 3,
  KEYPAD_CODE: 13,
  Z_KEY: 14,
  VIRTUAL: 15
} as const