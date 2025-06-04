// TTLock API Service - Smart Lock Integration
// Vacation Rental Property Management System

import crypto from 'crypto'

export interface TTLockConfig {
  apiKey: string
  apiSecret: string  
  clientId: string
  environment: 'sandbox' | 'production'
  endpoint?: string
}

export interface TTLockDevice {
  lockId: string
  lockName: string
  lockAlias?: string
  lockMac?: string
  lockType: string
  batteryLevel?: number
  lockStatus: 'LOCKED' | 'UNLOCKED' | 'UNKNOWN'
  signalStrength?: number
  isOnline: boolean
  lastHeartbeat?: Date
}

export interface TTLockPasscode {
  passcodeId: string
  passcode: string
  startDate: Date
  endDate: Date
  isActive: boolean
  passcodeType: 'PERMANENT' | 'TEMPORARY' | 'RECURRING'
}

export interface TTLockAccessLog {
  eventId: string
  lockId: string
  eventType: 'UNLOCK' | 'LOCK' | 'UNLOCK_FAILED' | 'LOCK_FAILED'
  accessMethod: 'PASSCODE' | 'MOBILE_APP' | 'KEYCARD' | 'BLUETOOTH'
  timestamp: Date
  passcodeId?: string
  batteryLevel?: number
  success: boolean
  errorCode?: string
}

export interface CreatePasscodeRequest {
  lockId: string
  passcode: string
  startDate: Date
  endDate: Date
  passcodeType?: 'PERMANENT' | 'TEMPORARY' | 'RECURRING'
  name?: string
}

export interface RemoteUnlockRequest {
  lockId: string
  reason?: string
}

/**
 * TTLock API Service for Smart Lock Management
 * 
 * Features:
 * - Device management and monitoring
 * - Passcode generation and management
 * - Remote lock/unlock operations
 * - Access logs and audit trail
 * - Real-time notifications
 */
export class TTLockService {
  private config: TTLockConfig
  private baseUrl: string

  constructor(config: TTLockConfig) {
    this.config = config
    this.baseUrl = config.endpoint || 'https://euapi.ttlock.com'
  }

  /**
   * Generate authentication signature for TTLock API
   */
  private generateSignature(params: Record<string, any>, timestamp: number): string {
    const sortedKeys = Object.keys(params).sort()
    const queryString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    const stringToSign = `${queryString}&timestamp=${timestamp}&${this.config.apiSecret}`
    
    return crypto
      .createHash('md5')
      .update(stringToSign)
      .digest('hex')
      .toUpperCase()
  }

  /**
   * Make authenticated API request to TTLock
   */
  private async makeRequest(
    endpoint: string, 
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'POST'
  ): Promise<any> {
    const timestamp = Date.now()
    const requestParams = {
      ...params,
      clientId: this.config.clientId,
      accessToken: this.config.apiKey,
      timestamp
    }

    const signature = this.generateSignature(requestParams, timestamp)
    requestParams.signature = signature

    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: method === 'POST' ? new URLSearchParams(requestParams).toString() : undefined
      })

      if (!response.ok) {
        throw new Error(`TTLock API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.errcode !== 0) {
        throw new Error(`TTLock API error: ${data.errcode} - ${data.errmsg}`)
      }

      return data
    } catch (error) {
      console.error('TTLock API request failed:', error)
      throw error
    }
  }

  /**
   * Get list of locks for the account
   */
  async getLocks(pageNo: number = 1, pageSize: number = 100): Promise<TTLockDevice[]> {
    const response = await this.makeRequest('/v3/lock/list', {
      pageNo,
      pageSize
    })

    return response.list?.map((lock: any) => ({
      lockId: lock.lockId.toString(),
      lockName: lock.lockName,
      lockAlias: lock.lockAlias,
      lockMac: lock.lockMac,
      lockType: lock.lockType,
      batteryLevel: lock.electricQuantity,
      lockStatus: this.mapLockStatus(lock.lockFlag),
      signalStrength: lock.rssi,
      isOnline: lock.lockFlag === 1,
      lastHeartbeat: lock.date ? new Date(lock.date) : undefined
    })) || []
  }

  /**
   * Get specific lock details
   */
  async getLock(lockId: string): Promise<TTLockDevice | null> {
    try {
      const response = await this.makeRequest('/v3/lock/detail', {
        lockId: parseInt(lockId)
      })

      if (!response.lockId) {
        return null
      }

      return {
        lockId: response.lockId.toString(),
        lockName: response.lockName,
        lockAlias: response.lockAlias,
        lockMac: response.lockMac,
        lockType: response.lockType,
        batteryLevel: response.electricQuantity,
        lockStatus: this.mapLockStatus(response.lockFlag),
        signalStrength: response.rssi,
        isOnline: response.lockFlag === 1,
        lastHeartbeat: response.date ? new Date(response.date) : undefined
      }
    } catch (error) {
      console.error(`Failed to get lock ${lockId}:`, error)
      return null
    }
  }

  /**
   * Create a new passcode for a lock
   */
  async createPasscode(request: CreatePasscodeRequest): Promise<TTLockPasscode> {
    const response = await this.makeRequest('/v3/lock/addPasscode', {
      lockId: parseInt(request.lockId),
      passcode: request.passcode,
      startDate: request.startDate.getTime(),
      endDate: request.endDate.getTime(),
      passcodeType: this.mapPasscodeType(request.passcodeType || 'TEMPORARY'),
      passcodeName: request.name || `Code-${Date.now()}`
    })

    return {
      passcodeId: response.passcodeId.toString(),
      passcode: request.passcode,
      startDate: request.startDate,
      endDate: request.endDate,
      isActive: true,
      passcodeType: request.passcodeType || 'TEMPORARY'
    }
  }

  /**
   * Delete a passcode
   */
  async deletePasscode(lockId: string, passcodeId: string): Promise<boolean> {
    try {
      await this.makeRequest('/v3/lock/deletePasscode', {
        lockId: parseInt(lockId),
        passcodeId: parseInt(passcodeId)
      })
      return true
    } catch (error) {
      console.error(`Failed to delete passcode ${passcodeId}:`, error)
      return false
    }
  }

  /**
   * Get passcodes for a lock
   */
  async getPasscodes(lockId: string): Promise<TTLockPasscode[]> {
    const response = await this.makeRequest('/v3/lock/listPasscode', {
      lockId: parseInt(lockId),
      pageNo: 1,
      pageSize: 100
    })

    return response.list?.map((passcode: any) => ({
      passcodeId: passcode.passcodeId.toString(),
      passcode: passcode.passcode,
      startDate: new Date(passcode.startDate),
      endDate: new Date(passcode.endDate),
      isActive: passcode.passcodeStatus === 1,
      passcodeType: this.mapPasscodeTypeFromTTLock(passcode.passcodeType)
    })) || []
  }

  /**
   * Remotely unlock a lock
   */
  async unlockRemotely(request: RemoteUnlockRequest): Promise<boolean> {
    try {
      await this.makeRequest('/v3/lock/unlock', {
        lockId: parseInt(request.lockId)
      })
      return true
    } catch (error) {
      console.error(`Failed to unlock lock ${request.lockId}:`, error)
      return false
    }
  }

  /**
   * Remotely lock a lock
   */
  async lockRemotely(lockId: string): Promise<boolean> {
    try {
      await this.makeRequest('/v3/lock/lock', {
        lockId: parseInt(lockId)
      })
      return true
    } catch (error) {
      console.error(`Failed to lock lock ${lockId}:`, error)
      return false
    }
  }

  /**
   * Get access logs for a lock
   */
  async getAccessLogs(
    lockId: string, 
    startDate: Date, 
    endDate: Date,
    pageNo: number = 1,
    pageSize: number = 100
  ): Promise<TTLockAccessLog[]> {
    const response = await this.makeRequest('/v3/lock/listRecord', {
      lockId: parseInt(lockId),
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      pageNo,
      pageSize
    })

    return response.list?.map((record: any) => ({
      eventId: record.recordId?.toString() || `${lockId}-${record.recordTime}`,
      lockId: lockId,
      eventType: this.mapEventType(record.recordType),
      accessMethod: this.mapAccessMethod(record.recordType),
      timestamp: new Date(record.recordTime),
      passcodeId: record.passcodeId?.toString(),
      batteryLevel: record.electricQuantity,
      success: record.success === 1,
      errorCode: record.success !== 1 ? record.recordType.toString() : undefined
    })) || []
  }

  /**
   * Generate a random secure passcode
   */
  generateSecurePasscode(length: number = 6): string {
    const digits = '0123456789'
    let passcode = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length)
      passcode += digits[randomIndex]
    }
    
    return passcode
  }

  /**
   * Validate passcode format
   */
  validatePasscode(passcode: string): boolean {
    // TTLock passcodes are typically 4-8 digits
    return /^\d{4,8}$/.test(passcode)
  }

  // Helper methods for mapping TTLock API responses

  private mapLockStatus(lockFlag: number): 'LOCKED' | 'UNLOCKED' | 'UNKNOWN' {
    switch (lockFlag) {
      case 0: return 'LOCKED'
      case 1: return 'UNLOCKED'
      default: return 'UNKNOWN'
    }
  }

  private mapPasscodeType(type: string): number {
    switch (type) {
      case 'PERMANENT': return 1
      case 'TEMPORARY': return 3
      case 'RECURRING': return 9
      default: return 3
    }
  }

  private mapPasscodeTypeFromTTLock(type: number): 'PERMANENT' | 'TEMPORARY' | 'RECURRING' {
    switch (type) {
      case 1: return 'PERMANENT'
      case 9: return 'RECURRING'
      default: return 'TEMPORARY'
    }
  }

  private mapEventType(recordType: number): 'UNLOCK' | 'LOCK' | 'UNLOCK_FAILED' | 'LOCK_FAILED' {
    // TTLock record types mapping (simplified)
    if (recordType >= 1 && recordType <= 10) return 'UNLOCK'
    if (recordType >= 11 && recordType <= 20) return 'LOCK'
    if (recordType >= 21 && recordType <= 30) return 'UNLOCK_FAILED'
    return 'LOCK_FAILED'
  }

  private mapAccessMethod(recordType: number): 'PASSCODE' | 'MOBILE_APP' | 'KEYCARD' | 'BLUETOOTH' {
    // Simplified mapping based on record type
    if (recordType === 1) return 'PASSCODE'
    if (recordType === 2) return 'MOBILE_APP'
    if (recordType === 3) return 'KEYCARD'
    return 'BLUETOOTH'
  }
}

/**
 * Default TTLock service instance
 * Initialize with environment variables
 */
export const createTTLockService = (config?: Partial<TTLockConfig>): TTLockService => {
  const defaultConfig: TTLockConfig = {
    apiKey: process.env.TTLOCK_API_KEY || '',
    apiSecret: process.env.TTLOCK_API_SECRET || '',
    clientId: process.env.TTLOCK_CLIENT_ID || '',
    environment: (process.env.TTLOCK_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    endpoint: process.env.TTLOCK_ENDPOINT || 'https://euapi.ttlock.com'
  }

  return new TTLockService({ ...defaultConfig, ...config })
}

// Export default instance
export const ttlockService = createTTLockService()