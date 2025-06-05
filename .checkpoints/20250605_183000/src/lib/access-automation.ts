/**
 * Smart Lock Access Automation & Monitoring Service
 * Comprehensive access management for vacation rental properties
 */

import { PrismaClient } from '@prisma/client'
import { UniversalSmartLockService } from './smart-lock-factory'
import type { LockPlatform } from './smart-lock-factory'

const prisma = new PrismaClient()
const smartLockService = new UniversalSmartLockService()

// Access rule types and interfaces
export interface ProviderAccessRule {
  propertyId: string
  providerId: string
  providerType: 'REGULAR' | 'OCCASIONAL' | 'EMERGENCY'
  timeRestriction: 'BUSINESS_HOURS' | 'EXTENDED_HOURS' | 'DAYLIGHT_ONLY' | 'CUSTOM' | 'NO_RESTRICTION'
  customTimeStart?: string // "09:00"
  customTimeEnd?: string   // "17:00"
  allowedWeekdays: number[] // [1,2,3,4,5] = Monday to Friday
  renewalPeriodDays: number // 180 for regular (6 months), varies for occasional
  notes?: string
}

export interface TenantAccessRule {
  propertyId: string
  tenantId: string
  tenantType: 'LONG_TERM' | 'SHORT_TERM' | 'VACATION_RENTAL'
  timeRestriction: 'BUSINESS_HOURS' | 'EXTENDED_HOURS' | 'DAYLIGHT_ONLY' | 'CUSTOM' | 'NO_RESTRICTION'
  customTimeStart?: string
  customTimeEnd?: string
  allowedWeekdays: number[]
  renewalPeriodDays: number // 90 for long-term (quarterly), lease period for short-term
  autoGenerateCode: boolean
  codeGenerationRule?: 'PHONE_LAST_5' | 'CUSTOM'
  codeDeliveryDays: number // 3 days before lease start
  notes?: string
}

export interface AccessViolation {
  id: string
  propertyId: string
  smartLockId: string
  accessTime: Date
  violationType: 'TIME_VIOLATION' | 'UNAUTHORIZED_ACCESS' | 'EXPIRED_CODE' | 'SUSPENDED_ACCESS'
  accessorType: 'PROVIDER' | 'TENANT' | 'GUEST' | 'UNKNOWN'
  accessorName: string
  accessorPhone?: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  actionsTaken: string[]
}

/**
 * Access Automation Service
 * Handles automatic access code generation, renewal, and monitoring
 */
export class AccessAutomationService {
  
  /**
   * 1. SZOLGÁLTATÓ HOZZÁFÉRÉS KEZELÉS
   */
  
  /**
   * Rendszeres szolgáltató hozzáférés beállítása (6 havi megújítás)
   */
  async setupRegularProviderAccess(rule: ProviderAccessRule): Promise<string> {
    const accessRule = await prisma.accessRule.create({
      data: {
        propertyId: rule.propertyId,
        providerId: rule.providerId,
        ruleType: 'PROVIDER',
        providerType: rule.providerType,
        timeRestriction: rule.timeRestriction,
        customTimeStart: rule.customTimeStart,
        customTimeEnd: rule.customTimeEnd,
        allowedWeekdays: rule.allowedWeekdays.join(','),
        renewalPeriodDays: rule.renewalPeriodDays,
        renewalStatus: 'ACTIVE',
        lastRenewalDate: new Date(),
        nextRenewalDate: new Date(Date.now() + rule.renewalPeriodDays * 24 * 60 * 60 * 1000),
        autoGenerateCode: false,
        notes: rule.notes
      }
    })

    // Generate initial access code
    await this.generateProviderAccessCode(accessRule.id)
    
    return accessRule.id
  }

  /**
   * Alkalmi szolgáltató hozzáférés beállítása (naptár alapú)
   */
  async setupOccasionalProviderAccess(
    rule: ProviderAccessRule, 
    startDate: Date, 
    endDate: Date
  ): Promise<string> {
    const accessRule = await prisma.accessRule.create({
      data: {
        propertyId: rule.propertyId,
        providerId: rule.providerId,
        ruleType: 'PROVIDER',
        providerType: 'OCCASIONAL',
        timeRestriction: rule.timeRestriction,
        customTimeStart: rule.customTimeStart,
        customTimeEnd: rule.customTimeEnd,
        allowedWeekdays: rule.allowedWeekdays.join(','),
        renewalPeriodDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
        renewalStatus: 'ACTIVE',
        lastRenewalDate: new Date(),
        nextRenewalDate: endDate,
        autoGenerateCode: false,
        notes: rule.notes
      }
    })

    // Generate time-limited access code
    await this.generateProviderAccessCode(accessRule.id, startDate, endDate)
    
    return accessRule.id
  }

  /**
   * 2. BÉRLŐ HOZZÁFÉRÉS KEZELÉS
   */

  /**
   * Hosszútávú bérlő hozzáférés (negyed éves megújítás)
   */
  async setupLongTermTenantAccess(rule: TenantAccessRule): Promise<string> {
    const accessRule = await prisma.accessRule.create({
      data: {
        propertyId: rule.propertyId,
        tenantId: rule.tenantId,
        ruleType: 'TENANT',
        tenantType: 'LONG_TERM',
        timeRestriction: rule.timeRestriction,
        customTimeStart: rule.customTimeStart,
        customTimeEnd: rule.customTimeEnd,
        allowedWeekdays: rule.allowedWeekdays.join(','),
        renewalPeriodDays: 90, // Quarterly renewal
        renewalStatus: 'ACTIVE',
        lastRenewalDate: new Date(),
        nextRenewalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        autoGenerateCode: rule.autoGenerateCode,
        codeGenerationRule: rule.codeGenerationRule,
        codeDeliveryDays: rule.codeDeliveryDays,
        notes: rule.notes
      }
    })

    // Generate initial access code
    await this.generateTenantAccessCode(accessRule.id)
    
    return accessRule.id
  }

  /**
   * Rövidtávú bérlő hozzáférés (14 napig, telefonszám alapú kód)
   */
  async setupShortTermTenantAccess(
    rule: TenantAccessRule,
    leaseStartDate: Date,
    leaseEndDate: Date,
    tenantPhone: string
  ): Promise<{ ruleId: string; accessCode: string; deliveryDate: Date }> {
    const accessRule = await prisma.accessRule.create({
      data: {
        propertyId: rule.propertyId,
        tenantId: rule.tenantId,
        ruleType: 'TENANT',
        tenantType: 'SHORT_TERM',
        timeRestriction: rule.timeRestriction || 'NO_RESTRICTION',
        customTimeStart: rule.customTimeStart,
        customTimeEnd: rule.customTimeEnd,
        allowedWeekdays: rule.allowedWeekdays.join(','),
        renewalPeriodDays: Math.ceil((leaseEndDate.getTime() - leaseStartDate.getTime()) / (24 * 60 * 60 * 1000)),
        renewalStatus: 'ACTIVE',
        lastRenewalDate: new Date(),
        nextRenewalDate: leaseEndDate,
        autoGenerateCode: true,
        codeGenerationRule: 'PHONE_LAST_5',
        codeDeliveryDays: 3,
        notes: `Short-term rental: ${leaseStartDate.toDateString()} - ${leaseEndDate.toDateString()}`
      }
    })

    // Generate phone-based access code
    const accessCode = this.generatePhoneBasedCode(tenantPhone)
    const deliveryDate = new Date(leaseStartDate.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days before

    await this.createAccessCode(accessRule.id, {
      code: accessCode,
      name: `Rövidtávú bérlő - ${tenantPhone}`,
      startDate: leaseStartDate,
      endDate: leaseEndDate,
      codeType: 'TEMPORARY',
      grantedToType: 'TENANT',
      purpose: 'Rövidtávú bérlés'
    })

    return {
      ruleId: accessRule.id,
      accessCode,
      deliveryDate
    }
  }

  /**
   * 3. HOZZÁFÉRÉS MONITOROZÁS
   */

  /**
   * Belépés monitorozás és engedély ellenőrzés
   */
  async monitorAccess(
    propertyId: string,
    smartLockId: string,
    accessLogId: string,
    accessorInfo: {
      type: 'PROVIDER' | 'TENANT' | 'GUEST' | 'ADMIN'
      id?: string
      name: string
      phone?: string
    }
  ): Promise<AccessViolation | null> {
    const accessLog = await prisma.accessLog.findUnique({
      where: { id: accessLogId },
      include: {
        accessCode: {
          include: {
            accessRule: true
          }
        }
      }
    })

    if (!accessLog) return null

    const accessTime = accessLog.eventTimestamp
    const violations: string[] = []
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'

    // Check if access was authorized
    let wasAuthorized = true
    let withinTimeLimit = true
    let accessRule = accessLog.accessCode?.accessRule

    if (!accessRule) {
      // No access rule found - potential unauthorized access
      wasAuthorized = false
      violations.push('NO_ACCESS_RULE')
      severity = 'HIGH'
    } else {
      // Check time restrictions
      const violation = this.checkTimeRestrictions(accessTime, accessRule)
      if (violation) {
        withinTimeLimit = false
        violations.push(violation)
        severity = 'MEDIUM'
      }

      // Check if access code is expired
      if (accessLog.accessCode && accessLog.accessCode.endDate < new Date()) {
        wasAuthorized = false
        violations.push('EXPIRED_CODE')
        severity = 'HIGH'
      }

      // Check renewal status
      if (accessRule.renewalStatus !== 'ACTIVE') {
        wasAuthorized = false
        violations.push('SUSPENDED_ACCESS')
        severity = 'CRITICAL'
      }
    }

    // Create monitoring record
    const monitoring = await prisma.accessMonitoring.create({
      data: {
        propertyId,
        smartLockId,
        accessLogId,
        accessTime,
        accessorType: accessorInfo.type,
        accessorId: accessorInfo.id,
        accessorName: accessorInfo.name,
        accessorPhone: accessorInfo.phone,
        wasAuthorized,
        ruleId: accessRule?.id,
        accessCodeId: accessLog.accessCode?.id,
        withinTimeLimit,
        expectedTimeStart: accessRule?.customTimeStart,
        expectedTimeEnd: accessRule?.customTimeEnd,
        isViolation: violations.length > 0,
        violationType: violations.length > 0 ? violations.join(',') : null,
        alertsSent: false
      }
    })

    // Return violation if any
    if (violations.length > 0) {
      return {
        id: monitoring.id,
        propertyId,
        smartLockId,
        accessTime,
        violationType: violations.join(',') as any,
        accessorType: accessorInfo.type,
        accessorName: accessorInfo.name,
        accessorPhone: accessorInfo.phone,
        severity,
        description: this.formatViolationDescription(violations, accessorInfo),
        actionsTaken: []
      }
    }

    return null
  }

  /**
   * 4. AUTOMATIKUS MEGÚJÍTÁS ÉS KARBANTARTÁS
   */

  /**
   * Lejáró hozzáférések megújítása
   */
  async renewExpiringAccess(): Promise<{ renewed: number; failed: string[] }> {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const expiringRules = await prisma.accessRule.findMany({
      where: {
        nextRenewalDate: { lte: tomorrow },
        renewalStatus: 'ACTIVE',
        isActive: true
      },
      include: {
        provider: true,
        tenant: true,
        property: true
      }
    })

    let renewed = 0
    const failed: string[] = []

    for (const rule of expiringRules) {
      try {
        if (rule.ruleType === 'PROVIDER' && rule.providerType === 'REGULAR') {
          // Renew regular provider access (6 months)
          await this.renewProviderAccess(rule.id, 180)
          renewed++
        } else if (rule.ruleType === 'TENANT' && rule.tenantType === 'LONG_TERM') {
          // Renew long-term tenant access (quarterly)
          await this.renewTenantAccess(rule.id, 90)
          renewed++
        }
        // Short-term and occasional access expire naturally
      } catch (error) {
        failed.push(`${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { renewed, failed }
  }

  /**
   * 5. SEGÉD FUNKCIÓK
   */

  private generatePhoneBasedCode(phone: string): string {
    // Extract last 5 digits from phone number
    const cleanPhone = phone.replace(/\D/g, '') // Remove non-digits
    if (cleanPhone.length >= 5) {
      return cleanPhone.slice(-5)
    }
    // Fallback if phone is too short
    return cleanPhone.padStart(5, '0')
  }

  private checkTimeRestrictions(accessTime: Date, accessRule: any): string | null {
    const hour = accessTime.getHours()
    const minute = accessTime.getMinutes()
    const currentTime = hour * 60 + minute // Minutes from midnight
    const weekday = accessTime.getDay() // 0 = Sunday, 1 = Monday, etc.
    const adjustedWeekday = weekday === 0 ? 7 : weekday // Convert to 1-7 scale

    // Check weekday restrictions
    const allowedWeekdays = accessRule.allowedWeekdays.split(',').map(Number)
    if (!allowedWeekdays.includes(adjustedWeekday)) {
      return 'WEEKDAY_VIOLATION'
    }

    // Check time restrictions
    let timeStart = 0
    let timeEnd = 1439 // 23:59

    switch (accessRule.timeRestriction) {
      case 'BUSINESS_HOURS':
        timeStart = 9 * 60 // 09:00
        timeEnd = 17 * 60 // 17:00
        break
      case 'EXTENDED_HOURS':
        timeStart = 7 * 60 // 07:00
        timeEnd = 19 * 60 // 19:00
        break
      case 'DAYLIGHT_ONLY':
        timeStart = 6 * 60 // 06:00
        timeEnd = 20 * 60 // 20:00
        break
      case 'CUSTOM':
        if (accessRule.customTimeStart) {
          const [startHour, startMin] = accessRule.customTimeStart.split(':').map(Number)
          timeStart = startHour * 60 + startMin
        }
        if (accessRule.customTimeEnd) {
          const [endHour, endMin] = accessRule.customTimeEnd.split(':').map(Number)
          timeEnd = endHour * 60 + endMin
        }
        break
      case 'NO_RESTRICTION':
        return null // No time restrictions
    }

    if (currentTime < timeStart || currentTime > timeEnd) {
      return 'TIME_VIOLATION'
    }

    return null
  }

  private formatViolationDescription(violations: string[], accessorInfo: any): string {
    const descriptions = {
      NO_ACCESS_RULE: 'Nincs érvényes hozzáférési szabály',
      WEEKDAY_VIOLATION: 'Nem engedélyezett napon történt belépés',
      TIME_VIOLATION: 'Időkorlátozáson kívüli belépés',
      EXPIRED_CODE: 'Lejárt hozzáférési kóddal történt belépés',
      SUSPENDED_ACCESS: 'Felfüggesztett hozzáféréssel történt belépés'
    }

    const violationTexts = violations.map(v => descriptions[v as keyof typeof descriptions] || v)
    return `${accessorInfo.name} (${accessorInfo.type}): ${violationTexts.join(', ')}`
  }

  private async generateProviderAccessCode(
    ruleId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<string> {
    const rule = await prisma.accessRule.findUnique({ where: { id: ruleId } })
    if (!rule) throw new Error('Access rule not found')

    const start = startDate || new Date()
    const end = endDate || new Date(Date.now() + rule.renewalPeriodDays * 24 * 60 * 60 * 1000)

    return this.createAccessCode(ruleId, {
      code: Math.random().toString().slice(2, 8), // 6-digit random code
      name: `Szolgáltató hozzáférés - ${rule.ruleType}`,
      startDate: start,
      endDate: end,
      codeType: rule.providerType === 'REGULAR' ? 'RECURRING' : 'TEMPORARY',
      grantedToType: 'PROVIDER',
      purpose: 'Szolgáltató hozzáférés'
    })
  }

  private async generateTenantAccessCode(ruleId: string): Promise<string> {
    const rule = await prisma.accessRule.findUnique({ where: { id: ruleId } })
    if (!rule) throw new Error('Access rule not found')

    const end = new Date(Date.now() + rule.renewalPeriodDays * 24 * 60 * 60 * 1000)

    return this.createAccessCode(ruleId, {
      code: Math.random().toString().slice(2, 8), // 6-digit random code
      name: `Bérlő hozzáférés - ${rule.tenantType}`,
      startDate: new Date(),
      endDate: end,
      codeType: rule.tenantType === 'LONG_TERM' ? 'RECURRING' : 'TEMPORARY',
      grantedToType: 'TENANT',
      purpose: 'Bérlői hozzáférés'
    })
  }

  private async createAccessCode(ruleId: string, codeData: {
    code: string
    name: string
    startDate: Date
    endDate: Date
    codeType: string
    grantedToType: string
    purpose: string
  }): Promise<string> {
    const rule = await prisma.accessRule.findUnique({
      where: { id: ruleId },
      include: { property: { include: { smartLocks: true } } }
    })

    if (!rule) throw new Error('Access rule not found')

    // Create access code for each smart lock on the property
    const smartLocks = rule.property.smartLocks
    const accessCodes: string[] = []

    for (const smartLock of smartLocks) {
      const accessCode = await prisma.accessCode.create({
        data: {
          smartLockId: smartLock.id,
          propertyId: rule.propertyId,
          accessRuleId: ruleId,
          code: codeData.code,
          codeType: codeData.codeType as any,
          grantedToType: codeData.grantedToType as any,
          grantedBy: 'system',
          startDate: codeData.startDate,
          endDate: codeData.endDate,
          purpose: codeData.purpose,
          notes: `Auto-generated for ${codeData.name}`
        }
      })

      // Actually create the code on the smart lock platform
      try {
        await smartLockService.createAccessCode(
          smartLock.platform as LockPlatform,
          smartLock.externalId,
          {
            smartLockId: smartLock.id,
            name: codeData.name,
            startDate: codeData.startDate,
            endDate: codeData.endDate,
            weekdays: rule.allowedWeekdays.split(',').map(Number),
            timeStart: rule.customTimeStart,
            timeEnd: rule.customTimeEnd
          }
        )
      } catch (error) {
        console.error(`Failed to create access code on ${smartLock.platform}:`, error)
      }

      accessCodes.push(accessCode.id)
    }

    return accessCodes[0] || ''
  }

  private async renewProviderAccess(ruleId: string, renewalDays: number): Promise<void> {
    const now = new Date()
    const nextRenewal = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000)

    await prisma.accessRule.update({
      where: { id: ruleId },
      data: {
        lastRenewalDate: now,
        nextRenewalDate: nextRenewal,
        renewalStatus: 'ACTIVE'
      }
    })

    // Generate new access code
    await this.generateProviderAccessCode(ruleId)
  }

  private async renewTenantAccess(ruleId: string, renewalDays: number): Promise<void> {
    const now = new Date()
    const nextRenewal = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000)

    await prisma.accessRule.update({
      where: { id: ruleId },
      data: {
        lastRenewalDate: now,
        nextRenewalDate: nextRenewal,
        renewalStatus: 'ACTIVE'
      }
    })

    // Generate new access code
    await this.generateTenantAccessCode(ruleId)
  }
}

// Export singleton instance
export const accessAutomationService = new AccessAutomationService()

/**
 * Scheduled job to run renewal checks
 * Should be called by a cron job daily
 */
export async function runAccessRenewalJob(): Promise<{ renewed: number; failed: string[] }> {
  console.log('Running access renewal job...')
  const result = await accessAutomationService.renewExpiringAccess()
  console.log(`Access renewal completed: ${result.renewed} renewed, ${result.failed.length} failed`)
  return result
}

/**
 * Helper function to get time restriction options for UI
 */
export function getTimeRestrictionOptions() {
  return [
    { value: 'BUSINESS_HOURS', label: 'Munkaidő (9:00-17:00)', start: '09:00', end: '17:00' },
    { value: 'EXTENDED_HOURS', label: 'Kibővített (7:00-19:00)', start: '07:00', end: '19:00' },
    { value: 'DAYLIGHT_ONLY', label: 'Csak nappal (6:00-20:00)', start: '06:00', end: '20:00' },
    { value: 'CUSTOM', label: 'Egyedi időszak', start: null, end: null },
    { value: 'NO_RESTRICTION', label: 'Nincs korlátozás', start: null, end: null }
  ]
}

/**
 * Helper function to get weekday options for UI
 */
export function getWeekdayOptions() {
  return [
    { value: 1, label: 'Hétfő' },
    { value: 2, label: 'Kedd' },
    { value: 3, label: 'Szerda' },
    { value: 4, label: 'Csütörtök' },
    { value: 5, label: 'Péntek' },
    { value: 6, label: 'Szombat' },
    { value: 7, label: 'Vasárnap' }
  ]
}