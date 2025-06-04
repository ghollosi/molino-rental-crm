/**
 * Smart Lock Platform Factory
 * Multi-platform smart lock integration factory for TTLock, Nuki, and other platforms
 */

import { TTLockService } from './ttlock'
import { NukiService, createNukiService } from './nuki'

export type LockPlatform = 'TTLOCK' | 'NUKI' | 'YALE' | 'AUGUST' | 'SCHLAGE'

// Universal smart lock interface
export interface UniversalSmartLock {
  id: string
  platform: LockPlatform
  externalId: string
  name: string
  model?: string
  state: 'LOCKED' | 'UNLOCKED' | 'UNKNOWN' | 'MAINTENANCE' | 'LOW_BATTERY' | 'OFFLINE'
  batteryLevel?: number
  isOnline: boolean
  lastSeen?: Date
}

export interface UniversalAccessCode {
  id: string
  code: string
  name: string
  startDate: Date
  endDate: Date
  isActive: boolean
  maxUsages?: number
  currentUsages: number
}

export interface CreateAccessCodeRequest {
  smartLockId: string
  name: string
  startDate: Date
  endDate: Date
  maxUsages?: number
  weekdays?: number[] // 1=Monday, 7=Sunday
  timeStart?: string // "09:00"
  timeEnd?: string // "18:00"
}

// Abstract base class for smart lock platforms
export abstract class SmartLockPlatformBase {
  abstract platform: LockPlatform

  abstract getDevices(): Promise<UniversalSmartLock[]>
  abstract getDevice(externalId: string): Promise<UniversalSmartLock>
  abstract lock(externalId: string): Promise<{ success: boolean; message?: string }>
  abstract unlock(externalId: string): Promise<{ success: boolean; message?: string }>
  abstract getAccessCodes(externalId: string): Promise<UniversalAccessCode[]>
  abstract createAccessCode(externalId: string, request: CreateAccessCodeRequest): Promise<UniversalAccessCode>
  abstract deleteAccessCode(externalId: string, codeId: string): Promise<boolean>
  abstract syncStatus(externalId: string): Promise<UniversalSmartLock>
}

/**
 * TTLock Platform Implementation
 */
export class TTLockPlatform extends SmartLockPlatformBase {
  platform: LockPlatform = 'TTLOCK'
  private service: TTLockService

  constructor(config: { apiKey: string; apiSecret: string; clientId: string }) {
    super()
    this.service = new TTLockService(config)
  }

  async getDevices(): Promise<UniversalSmartLock[]> {
    const devices = await this.service.getLockList()
    return devices.map(device => ({
      id: device.lockId.toString(),
      platform: 'TTLOCK',
      externalId: device.lockId.toString(),
      name: device.lockName,
      model: `TTLock ${device.lockVersion || 'Pro'}`,
      state: this.mapTTLockState(device.lockStatus),
      batteryLevel: device.electricQuantity,
      isOnline: device.lockStatus !== 'OFFLINE',
      lastSeen: device.date ? new Date(device.date) : undefined
    }))
  }

  async getDevice(externalId: string): Promise<UniversalSmartLock> {
    const device = await this.service.getLockDetail(parseInt(externalId))
    return {
      id: device.lockId.toString(),
      platform: 'TTLOCK',
      externalId: device.lockId.toString(),
      name: device.lockName,
      model: `TTLock ${device.lockVersion || 'Pro'}`,
      state: this.mapTTLockState(device.lockStatus),
      batteryLevel: device.electricQuantity,
      isOnline: device.lockStatus !== 'OFFLINE',
      lastSeen: device.date ? new Date(device.date) : undefined
    }
  }

  async lock(externalId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.service.controlLock({
        lockId: parseInt(externalId),
        command: 'lock'
      })
      return { success: true }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async unlock(externalId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.service.controlLock({
        lockId: parseInt(externalId),
        command: 'unlock'
      })
      return { success: true }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getAccessCodes(externalId: string): Promise<UniversalAccessCode[]> {
    const codes = await this.service.getPasscodeList(parseInt(externalId))
    return codes.map(code => ({
      id: code.passcodeId.toString(),
      code: code.passcode,
      name: code.passcodeName || 'TTLock Code',
      startDate: new Date(code.startDate),
      endDate: new Date(code.endDate),
      isActive: code.passcodeStatus === 'VALID',
      currentUsages: 0 // TTLock doesn't track usage count
    }))
  }

  async createAccessCode(externalId: string, request: CreateAccessCodeRequest): Promise<UniversalAccessCode> {
    const passcode = await this.service.createPasscode({
      lockId: parseInt(externalId),
      passcodeName: request.name,
      startDate: request.startDate.getTime(),
      endDate: request.endDate.getTime(),
      passcodeType: request.maxUsages ? 'PERIOD' : 'PERMANENT'
    })

    return {
      id: passcode.passcodeId.toString(),
      code: passcode.passcode,
      name: request.name,
      startDate: request.startDate,
      endDate: request.endDate,
      isActive: true,
      maxUsages: request.maxUsages,
      currentUsages: 0
    }
  }

  async deleteAccessCode(externalId: string, codeId: string): Promise<boolean> {
    try {
      await this.service.deletePasscode({
        lockId: parseInt(externalId),
        passcodeId: parseInt(codeId)
      })
      return true
    } catch {
      return false
    }
  }

  async syncStatus(externalId: string): Promise<UniversalSmartLock> {
    return this.getDevice(externalId)
  }

  private mapTTLockState(status: string): UniversalSmartLock['state'] {
    switch (status) {
      case 'LOCKED': return 'LOCKED'
      case 'UNLOCKED': return 'UNLOCKED'
      case 'LOW_BATTERY': return 'LOW_BATTERY'
      case 'OFFLINE': return 'OFFLINE'
      default: return 'UNKNOWN'
    }
  }
}

/**
 * Nuki Platform Implementation
 */
export class NukiPlatform extends SmartLockPlatformBase {
  platform: LockPlatform = 'NUKI'
  private service: NukiService

  constructor(config: { webApiToken: string; bridgeUrl?: string; bridgeToken?: string }) {
    super()
    this.service = createNukiService({
      webApiToken: config.webApiToken,
      bridgeUrl: config.bridgeUrl,
      bridgeToken: config.bridgeToken,
      isActive: true
    })
  }

  async getDevices(): Promise<UniversalSmartLock[]> {
    const devices = await this.service.getSmartLocks()
    return devices.map(device => ({
      id: device.smartlockId.toString(),
      platform: 'NUKI',
      externalId: device.smartlockId.toString(),
      name: device.name,
      model: this.service.mapNukiTypeToModel(device.type),
      state: this.mapNukiState(device.state),
      batteryLevel: device.batteryCharge,
      isOnline: device.state !== 255, // 255 = undefined
      lastSeen: new Date(device.updateDate)
    }))
  }

  async getDevice(externalId: string): Promise<UniversalSmartLock> {
    const device = await this.service.getSmartLock(parseInt(externalId))
    return {
      id: device.smartlockId.toString(),
      platform: 'NUKI',
      externalId: device.smartlockId.toString(),
      name: device.name,
      model: this.service.mapNukiTypeToModel(device.type),
      state: this.mapNukiState(device.state),
      batteryLevel: device.batteryCharge,
      isOnline: device.state !== 255,
      lastSeen: new Date(device.updateDate)
    }
  }

  async lock(externalId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.service.performAction(parseInt(externalId), { action: 2 }) // 2 = lock
      return { success: result.success }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async unlock(externalId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.service.performAction(parseInt(externalId), { action: 1 }) // 1 = unlock
      return { success: result.success }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getAccessCodes(externalId: string): Promise<UniversalAccessCode[]> {
    const auths = await this.service.getAuthorizations(parseInt(externalId))
    return auths
      .filter(auth => auth.type === 13) // Keypad codes only
      .map(auth => ({
        id: auth.id.toString(),
        code: auth.code?.toString() || '',
        name: auth.name,
        startDate: auth.allowedFromDate ? new Date(auth.allowedFromDate) : new Date(),
        endDate: auth.allowedUntilDate ? new Date(auth.allowedUntilDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: auth.enabled,
        currentUsages: auth.lockCount
      }))
  }

  async createAccessCode(externalId: string, request: CreateAccessCodeRequest): Promise<UniversalAccessCode> {
    const code = this.service.generateAccessCode()
    
    // Convert weekdays array to bitmask
    let weekdaysBitmask = 0
    if (request.weekdays) {
      request.weekdays.forEach(day => {
        weekdaysBitmask |= (1 << (day - 1)) // Convert 1-7 to 0-6
      })
    } else {
      weekdaysBitmask = 127 // All days (1111111 in binary)
    }

    // Convert time strings to minutes
    const timeStart = request.timeStart ? this.timeToMinutes(request.timeStart) : 0
    const timeEnd = request.timeEnd ? this.timeToMinutes(request.timeEnd) : 1439 // 23:59

    const auth = await this.service.createAuthorization({
      smartlockId: parseInt(externalId),
      name: request.name,
      type: 13, // Keypad code
      code,
      remoteAllowed: true,
      allowedFromDate: request.startDate.toISOString(),
      allowedUntilDate: request.endDate.toISOString(),
      allowedWeekDays: weekdaysBitmask,
      allowedFromTime: timeStart,
      allowedUntilTime: timeEnd
    })

    return {
      id: auth.id.toString(),
      code: code.toString(),
      name: request.name,
      startDate: request.startDate,
      endDate: request.endDate,
      isActive: auth.enabled,
      maxUsages: request.maxUsages,
      currentUsages: 0
    }
  }

  async deleteAccessCode(externalId: string, codeId: string): Promise<boolean> {
    return this.service.deleteAuthorization(parseInt(externalId), parseInt(codeId))
  }

  async syncStatus(externalId: string): Promise<UniversalSmartLock> {
    return this.getDevice(externalId)
  }

  private mapNukiState(state: number): UniversalSmartLock['state'] {
    switch (state) {
      case 1: return 'LOCKED'
      case 3: case 5: return 'UNLOCKED' // unlocked or unlatched
      case 254: return 'MAINTENANCE' // motor blocked
      case 255: return 'UNKNOWN'
      default: return 'UNKNOWN'
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
}

/**
 * Smart Lock Platform Factory
 */
export class SmartLockFactory {
  private static platforms = new Map<LockPlatform, SmartLockPlatformBase>()

  static registerPlatform(platform: LockPlatform, service: SmartLockPlatformBase) {
    this.platforms.set(platform, service)
  }

  static getPlatform(platform: LockPlatform): SmartLockPlatformBase {
    const service = this.platforms.get(platform)
    if (!service) {
      throw new Error(`Platform ${platform} is not registered`)
    }
    return service
  }

  static getAvailablePlatforms(): LockPlatform[] {
    return Array.from(this.platforms.keys())
  }

  static async initializePlatforms(configs: {
    ttlock?: { apiKey: string; apiSecret: string; clientId: string }
    nuki?: { webApiToken: string; bridgeUrl?: string; bridgeToken?: string }
  }) {
    if (configs.ttlock) {
      this.registerPlatform('TTLOCK', new TTLockPlatform(configs.ttlock))
    }

    if (configs.nuki) {
      this.registerPlatform('NUKI', new NukiPlatform(configs.nuki))
    }
  }
}

/**
 * Universal Smart Lock Service
 * Provides a unified interface across all platforms
 */
export class UniversalSmartLockService {
  async getDevice(platform: LockPlatform, externalId: string): Promise<UniversalSmartLock> {
    const platformService = SmartLockFactory.getPlatform(platform)
    return platformService.getDevice(externalId)
  }

  async lock(platform: LockPlatform, externalId: string): Promise<{ success: boolean; message?: string }> {
    const platformService = SmartLockFactory.getPlatform(platform)
    return platformService.lock(externalId)
  }

  async unlock(platform: LockPlatform, externalId: string): Promise<{ success: boolean; message?: string }> {
    const platformService = SmartLockFactory.getPlatform(platform)
    return platformService.unlock(externalId)
  }

  async createAccessCode(
    platform: LockPlatform, 
    externalId: string, 
    request: CreateAccessCodeRequest
  ): Promise<UniversalAccessCode> {
    const platformService = SmartLockFactory.getPlatform(platform)
    return platformService.createAccessCode(externalId, request)
  }

  async deleteAccessCode(platform: LockPlatform, externalId: string, codeId: string): Promise<boolean> {
    const platformService = SmartLockFactory.getPlatform(platform)
    return platformService.deleteAccessCode(externalId, codeId)
  }

  async syncStatus(platform: LockPlatform, externalId: string): Promise<UniversalSmartLock> {
    const platformService = SmartLockFactory.getPlatform(platform)
    return platformService.syncStatus(externalId)
  }
}

// Export singleton instance
export const universalSmartLockService = new UniversalSmartLockService()