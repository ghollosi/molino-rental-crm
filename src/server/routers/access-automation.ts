/**
 * Access Automation & Monitoring tRPC Router
 * API endpoints for smart lock access management
 */

import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { accessAutomationService } from '@/lib/access-automation'
import type { ProviderAccessRule, TenantAccessRule } from '@/lib/access-automation'

// Input validation schemas
const providerAccessRuleSchema = z.object({
  propertyId: z.string(),
  providerId: z.string(),
  providerType: z.enum(['REGULAR', 'OCCASIONAL', 'EMERGENCY']),
  timeRestriction: z.enum(['BUSINESS_HOURS', 'EXTENDED_HOURS', 'DAYLIGHT_ONLY', 'CUSTOM', 'NO_RESTRICTION']),
  customTimeStart: z.string().optional(),
  customTimeEnd: z.string().optional(),
  allowedWeekdays: z.array(z.number().min(1).max(7)),
  renewalPeriodDays: z.number().positive(),
  notes: z.string().optional()
})

const tenantAccessRuleSchema = z.object({
  propertyId: z.string(),
  tenantId: z.string(),
  tenantType: z.enum(['LONG_TERM', 'SHORT_TERM', 'VACATION_RENTAL']),
  timeRestriction: z.enum(['BUSINESS_HOURS', 'EXTENDED_HOURS', 'DAYLIGHT_ONLY', 'CUSTOM', 'NO_RESTRICTION']),
  customTimeStart: z.string().optional(),
  customTimeEnd: z.string().optional(),
  allowedWeekdays: z.array(z.number().min(1).max(7)),
  renewalPeriodDays: z.number().positive(),
  autoGenerateCode: z.boolean(),
  codeGenerationRule: z.enum(['PHONE_LAST_5', 'CUSTOM']).optional(),
  codeDeliveryDays: z.number().positive(),
  notes: z.string().optional()
})

const shortTermTenantSchema = z.object({
  rule: tenantAccessRuleSchema,
  leaseStartDate: z.date(),
  leaseEndDate: z.date(),
  tenantPhone: z.string()
})

const occasionalProviderSchema = z.object({
  rule: providerAccessRuleSchema,
  startDate: z.date(),
  endDate: z.date()
})

const monitorAccessSchema = z.object({
  propertyId: z.string(),
  smartLockId: z.string(),
  accessLogId: z.string(),
  accessorInfo: z.object({
    type: z.enum(['PROVIDER', 'TENANT', 'GUEST', 'ADMIN']),
    id: z.string().optional(),
    name: z.string(),
    phone: z.string().optional()
  })
})

const paginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(50)
})

export const accessAutomationRouter = createTRPCRouter({
  /**
   * SZOLGÁLTATÓ HOZZÁFÉRÉS KEZELÉS
   */
  
  // Rendszeres szolgáltató hozzáférés (6 havi megújítás)
  setupRegularProviderAccess: publicProcedure
    .input(providerAccessRuleSchema)
    .mutation(async ({ input }) => {
      const rule: ProviderAccessRule = {
        ...input,
        renewalPeriodDays: input.providerType === 'REGULAR' ? 180 : input.renewalPeriodDays
      }
      
      const ruleId = await accessAutomationService.setupRegularProviderAccess(rule)
      
      return {
        success: true,
        ruleId,
        message: 'Rendszeres szolgáltató hozzáférés sikeresen beállítva'
      }
    }),

  // Alkalmi szolgáltató hozzáférés (naptár alapú)
  setupOccasionalProviderAccess: publicProcedure
    .input(occasionalProviderSchema)
    .mutation(async ({ input }) => {
      const { rule, startDate, endDate } = input
      const ruleId = await accessAutomationService.setupOccasionalProviderAccess(rule, startDate, endDate)
      
      return {
        success: true,
        ruleId,
        message: 'Alkalmi szolgáltató hozzáférés sikeresen beállítva'
      }
    }),

  /**
   * BÉRLŐ HOZZÁFÉRÉS KEZELÉS
   */
  
  // Hosszútávú bérlő hozzáférés (negyed éves megújítás)
  setupLongTermTenantAccess: publicProcedure
    .input(tenantAccessRuleSchema)
    .mutation(async ({ input }) => {
      const rule: TenantAccessRule = {
        ...input,
        renewalPeriodDays: 90 // Quarterly renewal for long-term tenants
      }
      
      const ruleId = await accessAutomationService.setupLongTermTenantAccess(rule)
      
      return {
        success: true,
        ruleId,
        message: 'Hosszútávú bérlő hozzáférés sikeresen beállítva'
      }
    }),

  // Rövidtávú bérlő hozzáférés (telefonszám alapú kód)
  setupShortTermTenantAccess: publicProcedure
    .input(shortTermTenantSchema)
    .mutation(async ({ input }) => {
      const { rule, leaseStartDate, leaseEndDate, tenantPhone } = input
      
      const result = await accessAutomationService.setupShortTermTenantAccess(
        rule,
        leaseStartDate,
        leaseEndDate,
        tenantPhone
      )
      
      return {
        success: true,
        ...result,
        message: 'Rövidtávú bérlő hozzáférés sikeresen beállítva'
      }
    }),

  /**
   * HOZZÁFÉRÉS MONITOROZÁS
   */
  
  // Belépés monitorozás és engedély ellenőrzés
  monitorAccess: publicProcedure
    .input(monitorAccessSchema)
    .mutation(async ({ input }) => {
      const { propertyId, smartLockId, accessLogId, accessorInfo } = input
      
      const violation = await accessAutomationService.monitorAccess(
        propertyId,
        smartLockId,
        accessLogId,
        accessorInfo
      )
      
      return {
        success: true,
        violation,
        hasViolation: violation !== null,
        message: violation 
          ? `Szabálysértés észlelve: ${violation.description}`
          : 'Hozzáférés engedélyezett és monitorozva'
      }
    }),

  // Hozzáférési szabálysértések lekérdezése
  getAccessViolations: publicProcedure
    .input(z.object({
      propertyId: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      ...paginationSchema.shape
    }))
    .query(async ({ input, ctx }) => {
      const { page, limit, propertyId, startDate, endDate, severity } = input
      
      const where: any = {
        isViolation: true
      }
      
      if (propertyId) where.propertyId = propertyId
      if (startDate || endDate) {
        where.accessTime = {}
        if (startDate) where.accessTime.gte = startDate
        if (endDate) where.accessTime.lte = endDate
      }
      if (severity) where.violationType = { contains: severity }
      
      const [violations, total] = await Promise.all([
        ctx.prisma.accessMonitoring.findMany({
          where,
          include: {
            property: true,
            smartLock: true,
            accessLog: {
              include: {
                accessCode: true
              }
            },
            accessRule: true
          },
          orderBy: { accessTime: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        ctx.prisma.accessMonitoring.count({ where })
      ])
      
      return {
        violations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }),

  // Hozzáférési monitorozási riport
  getAccessReport: publicProcedure
    .input(z.object({
      propertyId: z.string(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input, ctx }) => {
      const { propertyId, startDate, endDate } = input
      
      const [totalAccess, violations, topAccessors, accessByDay] = await Promise.all([
        // Összes hozzáférés
        ctx.prisma.accessMonitoring.count({
          where: {
            propertyId,
            accessTime: { gte: startDate, lte: endDate }
          }
        }),
        
        // Szabálysértések
        ctx.prisma.accessMonitoring.count({
          where: {
            propertyId,
            accessTime: { gte: startDate, lte: endDate },
            isViolation: true
          }
        }),
        
        // Leggyakoribb belépők
        ctx.prisma.accessMonitoring.groupBy({
          by: ['accessorName', 'accessorType'],
          where: {
            propertyId,
            accessTime: { gte: startDate, lte: endDate }
          },
          _count: { accessorName: true },
          orderBy: { _count: { accessorName: 'desc' } },
          take: 10
        }),
        
        // Napi statisztika
        ctx.prisma.$queryRaw`
          SELECT 
            DATE(access_time) as date,
            COUNT(*) as total_access,
            COUNT(CASE WHEN is_violation = true THEN 1 END) as violations
          FROM "AccessMonitoring" 
          WHERE property_id = ${propertyId} 
            AND access_time >= ${startDate} 
            AND access_time <= ${endDate}
          GROUP BY DATE(access_time)
          ORDER BY date
        `
      ])
      
      return {
        summary: {
          totalAccess,
          violations,
          violationRate: totalAccess > 0 ? (violations / totalAccess * 100).toFixed(2) : '0',
          period: {
            start: startDate,
            end: endDate
          }
        },
        topAccessors: topAccessors.map(accessor => ({
          name: accessor.accessorName,
          type: accessor.accessorType,
          count: accessor._count.accessorName
        })),
        dailyStats: accessByDay
      }
    }),

  /**
   * AUTOMATIKUS MEGÚJÍTÁS
   */
  
  // Lejáró hozzáférések megújítása (cron job)
  renewExpiringAccess: publicProcedure
    .mutation(async () => {
      const result = await accessAutomationService.renewExpiringAccess()
      
      return {
        success: true,
        ...result,
        message: `${result.renewed} hozzáférés megújítva, ${result.failed.length} hiba`
      }
    }),

  // Lejáró hozzáférések lekérdezése
  getExpiringAccess: publicProcedure
    .input(z.object({
      daysAhead: z.number().positive().default(7),
      propertyId: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const { daysAhead, propertyId } = input
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysAhead)
      
      const where: any = {
        nextRenewalDate: { lte: futureDate },
        renewalStatus: 'ACTIVE',
        isActive: true
      }
      
      if (propertyId) where.propertyId = propertyId
      
      const expiringRules = await ctx.prisma.accessRule.findMany({
        where,
        include: {
          property: true,
          provider: {
            include: { user: true }
          },
          tenant: {
            include: { user: true }
          }
        },
        orderBy: { nextRenewalDate: 'asc' }
      })
      
      return {
        expiring: expiringRules,
        count: expiringRules.length
      }
    }),

  /**
   * HOZZÁFÉRÉSI SZABÁLYOK KEZELÉSE
   */
  
  // Aktív hozzáférési szabályok lekérdezése
  getAccessRules: publicProcedure
    .input(z.object({
      propertyId: z.string().optional(),
      ruleType: z.enum(['PROVIDER', 'TENANT']).optional(),
      status: z.enum(['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED', 'SUSPENDED']).optional(),
      ...paginationSchema.shape
    }))
    .query(async ({ input, ctx }) => {
      const { page, limit, propertyId, ruleType, status } = input
      
      const where: any = {}
      if (propertyId) where.propertyId = propertyId
      if (ruleType) where.ruleType = ruleType
      if (status) where.renewalStatus = status
      
      const [rules, total] = await Promise.all([
        ctx.prisma.accessRule.findMany({
          where,
          include: {
            property: true,
            provider: {
              include: { user: true }
            },
            tenant: {
              include: { user: true }
            },
            accessCodes: {
              where: { isActive: true },
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { nextRenewalDate: 'asc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        ctx.prisma.accessRule.count({ where })
      ])
      
      return {
        rules,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }),

  // Hozzáférési szabály módosítása
  updateAccessRule: publicProcedure
    .input(z.object({
      ruleId: z.string(),
      timeRestriction: z.enum(['BUSINESS_HOURS', 'EXTENDED_HOURS', 'DAYLIGHT_ONLY', 'CUSTOM', 'NO_RESTRICTION']).optional(),
      customTimeStart: z.string().optional(),
      customTimeEnd: z.string().optional(),
      allowedWeekdays: z.array(z.number().min(1).max(7)).optional(),
      renewalStatus: z.enum(['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED', 'SUSPENDED']).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { ruleId, ...updateData } = input
      
      const updatedRule = await ctx.prisma.accessRule.update({
        where: { id: ruleId },
        data: {
          ...updateData,
          allowedWeekdays: updateData.allowedWeekdays?.join(','),
          updatedAt: new Date()
        },
        include: {
          property: true,
          provider: { include: { user: true } },
          tenant: { include: { user: true } }
        }
      })
      
      return {
        success: true,
        rule: updatedRule,
        message: 'Hozzáférési szabály sikeresen frissítve'
      }
    }),

  // Hozzáférési szabály deaktiválása
  deactivateAccessRule: publicProcedure
    .input(z.object({
      ruleId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const { ruleId } = input
      
      await ctx.prisma.accessRule.update({
        where: { id: ruleId },
        data: {
          isActive: false,
          renewalStatus: 'SUSPENDED',
          updatedAt: new Date()
        }
      })
      
      // Deactivate associated access codes
      await ctx.prisma.accessCode.updateMany({
        where: { accessRuleId: ruleId },
        data: { isActive: false }
      })
      
      return {
        success: true,
        message: 'Hozzáférési szabály és kapcsolódó kódok deaktiválva'
      }
    }),

  /**
   * SEGÉDPROCEDÚRÁK UI-hoz
   */
  
  // Időkorlátozási opciók
  getTimeRestrictionOptions: publicProcedure
    .query(() => {
      return [
        { value: 'BUSINESS_HOURS', label: 'Munkaidő (9:00-17:00)', start: '09:00', end: '17:00' },
        { value: 'EXTENDED_HOURS', label: 'Kibővített (7:00-19:00)', start: '07:00', end: '19:00' },
        { value: 'DAYLIGHT_ONLY', label: 'Csak nappal (6:00-20:00)', start: '06:00', end: '20:00' },
        { value: 'CUSTOM', label: 'Egyedi időszak', start: null, end: null },
        { value: 'NO_RESTRICTION', label: 'Nincs korlátozás', start: null, end: null }
      ]
    }),

  // Hétköznapi opciók
  getWeekdayOptions: publicProcedure
    .query(() => {
      return [
        { value: 1, label: 'Hétfő' },
        { value: 2, label: 'Kedd' },
        { value: 3, label: 'Szerda' },
        { value: 4, label: 'Csütörtök' },
        { value: 5, label: 'Péntek' },
        { value: 6, label: 'Szombat' },
        { value: 7, label: 'Vasárnap' }
      ]
    })
})