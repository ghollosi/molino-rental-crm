import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { ttlockService } from '@/lib/ttlock'
import { universalSmartLockService, SmartLockFactory } from '@/lib/smart-lock-factory'
import type { LockPlatform } from '@/lib/smart-lock-factory'
import crypto from 'crypto'

// Input validation schemas
const createSmartLockSchema = z.object({
  propertyId: z.string(),
  platform: z.enum(['TTLOCK', 'NUKI', 'YALE', 'AUGUST', 'SCHLAGE']),
  externalId: z.string(), // TTLock ID, Nuki ID, etc.
  lockName: z.string(),
  lockAlias: z.string().optional(),
  lockModel: z.string().optional(),
  location: z.string().optional(),
  floor: z.number().optional()
})

const createAccessCodeSchema = z.object({
  smartLockId: z.string(),
  grantedTo: z.string().optional(),
  grantedToType: z.enum(['USER', 'PROVIDER', 'TENANT', 'GUEST', 'EMERGENCY', 'SYSTEM']),
  codeType: z.enum(['PERMANENT', 'TEMPORARY', 'RECURRING', 'EMERGENCY', 'MASTER']),
  startDate: z.date(),
  endDate: z.date(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  maxUsages: z.number().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.any().optional()
})

const remoteAccessSchema = z.object({
  smartLockId: z.string(),
  action: z.enum(['unlock', 'lock']),
  reason: z.string().optional()
})

const accessLogFilterSchema = z.object({
  smartLockId: z.string().optional(),
  propertyId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  eventType: z.enum(['UNLOCK', 'LOCK', 'UNLOCK_FAILED', 'LOCK_FAILED', 'CODE_ADDED', 'CODE_REMOVED', 'BATTERY_LOW', 'DEVICE_OFFLINE', 'DEVICE_ONLINE', 'TAMPER_ALERT']).optional(),
  accessedBy: z.string().optional(),
  flagged: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().min(1).max(100).default(20)
})

export const smartLockRouter = createTRPCRouter({
  /**
   * Get all smart locks for properties user has access to
   */
  list: protectedProcedure
    .input(z.object({
      propertyId: z.string().optional(),
      isActive: z.boolean().optional(),
      page: z.number().default(1),
      limit: z.number().min(1).max(100).default(20)
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {}
      
      // Filter by property access
      if (input.propertyId) {
        where.propertyId = input.propertyId
      } else {
        // Only show locks for properties user has access to
        const userProperties = await ctx.db.property.findMany({
          where: {
            OR: [
              { ownerId: ctx.session.user.id },
              { owner: { userId: ctx.session.user.id } }
            ]
          },
          select: { id: true }
        })
        where.propertyId = { in: userProperties.map(p => p.id) }
      }

      if (input.isActive !== undefined) {
        where.isActive = input.isActive
      }

      const [smartLocks, total] = await Promise.all([
        ctx.db.smartLock.findMany({
          where,
          include: {
            property: {
              select: {
                id: true,
                address: true,
                street: true,
                city: true
              }
            },
            accessCodes: {
              where: { isActive: true },
              select: { id: true, codeType: true, endDate: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit
        }),
        ctx.db.smartLock.count({ where })
      ])

      return {
        smartLocks,
        total,
        pages: Math.ceil(total / input.limit)
      }
    }),

  /**
   * Get specific smart lock details
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const smartLock = await ctx.db.smartLock.findUnique({
        where: { id: input.id },
        include: {
          property: {
            select: {
              id: true,
              address: true,
              street: true,
              city: true,
              owner: { select: { userId: true } }
            }
          },
          accessCodes: {
            where: { isActive: true },
            include: {
              grantedByUser: {
                select: { id: true, email: true, firstName: true, lastName: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!smartLock) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Smart lock not found'
        })
      }

      // Check access permissions
      const hasAccess = smartLock.property.owner.userId === ctx.session.user.id ||
        ['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        })
      }

      return smartLock
    }),

  /**
   * Create/register a new smart lock
   */
  create: protectedProcedure
    .input(createSmartLockSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify property ownership
      const property = await ctx.db.property.findUnique({
        where: { id: input.propertyId },
        include: { owner: true }
      })

      if (!property) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Property not found'
        })
      }

      const hasAccess = property.owner.userId === ctx.session.user.id ||
        ['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        })
      }

      // Check if TTLock ID already exists
      const existingLock = await ctx.db.smartLock.findUnique({
        where: { ttlockId: input.ttlockId }
      })

      if (existingLock) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Smart lock with this TTLock ID already exists'
        })
      }

      // Verify lock exists in TTLock system
      try {
        const ttlockDevice = await ttlockService.getLock(input.ttlockId)
        if (!ttlockDevice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'TTLock device not found'
          })
        }

        // Create smart lock record
        const smartLock = await ctx.db.smartLock.create({
          data: {
            propertyId: input.propertyId,
            ttlockId: input.ttlockId,
            lockName: input.lockName,
            lockAlias: input.lockAlias,
            location: input.location,
            floor: input.floor,
            lockType: ttlockDevice.lockType,
            batteryLevel: ttlockDevice.batteryLevel,
            lockStatus: ttlockDevice.lockStatus as any,
            signalStrength: ttlockDevice.signalStrength,
            isOnline: ttlockDevice.isOnline,
            lastHeartbeat: ttlockDevice.lastHeartbeat
          },
          include: {
            property: {
              select: { address: true, street: true, city: true }
            }
          }
        })

        return smartLock
      } catch (error) {
        console.error('Failed to create smart lock:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create smart lock'
        })
      }
    }),

  /**
   * Update smart lock details
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      lockName: z.string().optional(),
      lockAlias: z.string().optional(),
      location: z.string().optional(),
      floor: z.number().optional(),
      isActive: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      const smartLock = await ctx.db.smartLock.findUnique({
        where: { id },
        include: { property: { include: { owner: true } } }
      })

      if (!smartLock) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Smart lock not found'
        })
      }

      // Check permissions
      const hasAccess = smartLock.property.owner.userId === ctx.session.user.id ||
        ['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        })
      }

      return await ctx.db.smartLock.update({
        where: { id },
        data: updateData
      })
    }),

  /**
   * Sync smart lock status with TTLock API
   */
  syncStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const smartLock = await ctx.db.smartLock.findUnique({
        where: { id: input.id },
        include: { property: { include: { owner: true } } }
      })

      if (!smartLock) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Smart lock not found'
        })
      }

      // Check permissions
      const hasAccess = smartLock.property.owner.userId === ctx.session.user.id ||
        ['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        })
      }

      try {
        const ttlockDevice = await ttlockService.getLock(smartLock.ttlockId)
        if (!ttlockDevice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'TTLock device not found'
          })
        }

        const updatedLock = await ctx.db.smartLock.update({
          where: { id: input.id },
          data: {
            batteryLevel: ttlockDevice.batteryLevel,
            lockStatus: ttlockDevice.lockStatus as any,
            signalStrength: ttlockDevice.signalStrength,
            isOnline: ttlockDevice.isOnline,
            lastHeartbeat: ttlockDevice.lastHeartbeat || new Date()
          }
        })

        return updatedLock
      } catch (error) {
        console.error('Failed to sync smart lock status:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync lock status'
        })
      }
    }),

  /**
   * Create access code for smart lock
   */
  createAccessCode: protectedProcedure
    .input(createAccessCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const smartLock = await ctx.db.smartLock.findUnique({
        where: { id: input.smartLockId },
        include: { property: { include: { owner: true } } }
      })

      if (!smartLock) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Smart lock not found'
        })
      }

      // Check permissions
      const hasAccess = smartLock.property.owner.userId === ctx.session.user.id ||
        ['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        })
      }

      try {
        // Generate secure passcode
        const passcode = ttlockService.generateSecurePasscode(6)
        
        // Create passcode in TTLock system
        const ttlockPasscode = await ttlockService.createPasscode({
          lockId: smartLock.ttlockId,
          passcode,
          startDate: input.startDate,
          endDate: input.endDate,
          passcodeType: input.codeType === 'PERMANENT' ? 'PERMANENT' : 
                       input.codeType === 'RECURRING' ? 'RECURRING' : 'TEMPORARY',
          name: `${input.purpose || 'Access'}-${Date.now()}`
        })

        // Encrypt passcode for database storage
        const encryptedCode = crypto
          .createHash('sha256')
          .update(passcode)
          .digest('hex')

        // Store access code in database
        const accessCode = await ctx.db.accessCode.create({
          data: {
            smartLockId: input.smartLockId,
            propertyId: smartLock.propertyId,
            ttlockPasscodeId: ttlockPasscode.passcodeId,
            code: encryptedCode,
            codeType: input.codeType,
            grantedTo: input.grantedTo,
            grantedToType: input.grantedToType,
            grantedBy: ctx.session.user.id,
            startDate: input.startDate,
            endDate: input.endDate,
            isRecurring: input.isRecurring,
            recurringPattern: input.recurringPattern,
            maxUsages: input.maxUsages,
            purpose: input.purpose,
            notes: input.notes
          },
          include: {
            grantedByUser: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        })

        // Log the access code creation
        await ctx.db.accessLog.create({
          data: {
            smartLockId: input.smartLockId,
            propertyId: smartLock.propertyId,
            accessCodeId: accessCode.id,
            eventType: 'CODE_ADDED',
            accessMethod: 'MOBILE_APP',
            accessedBy: ctx.session.user.id,
            accessedByType: 'USER',
            success: true,
            notes: `Access code created: ${input.purpose || 'General access'}`
          }
        })

        return {
          ...accessCode,
          passcode // Return actual passcode only once for user to save
        }
      } catch (error) {
        console.error('Failed to create access code:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create access code'
        })
      }
    }),

  /**
   * Deactivate/delete access code
   */
  deleteAccessCode: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const accessCode = await ctx.db.accessCode.findUnique({
        where: { id: input.id },
        include: {
          smartLock: {
            include: { property: { include: { owner: true } } }
          }
        }
      })

      if (!accessCode) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access code not found'
        })
      }

      // Check permissions
      const hasAccess = accessCode.smartLock.property.owner.userId === ctx.session.user.id ||
        ['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        })
      }

      try {
        // Delete from TTLock system
        if (accessCode.ttlockPasscodeId) {
          await ttlockService.deletePasscode(
            accessCode.smartLock.ttlockId,
            accessCode.ttlockPasscodeId
          )
        }

        // Deactivate in database
        const updatedCode = await ctx.db.accessCode.update({
          where: { id: input.id },
          data: { isActive: false }
        })

        // Log the deletion
        await ctx.db.accessLog.create({
          data: {
            smartLockId: accessCode.smartLockId,
            propertyId: accessCode.propertyId,
            accessCodeId: accessCode.id,
            eventType: 'CODE_REMOVED',
            accessMethod: 'MOBILE_APP',
            accessedBy: ctx.session.user.id,
            accessedByType: 'USER',
            success: true,
            notes: `Access code deactivated: ${accessCode.purpose || 'Code removed'}`
          }
        })

        return updatedCode
      } catch (error) {
        console.error('Failed to delete access code:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete access code'
        })
      }
    }),

  /**
   * Remote lock/unlock operation
   */
  remoteAccess: protectedProcedure
    .input(remoteAccessSchema)
    .mutation(async ({ ctx, input }) => {
      const smartLock = await ctx.db.smartLock.findUnique({
        where: { id: input.smartLockId },
        include: { property: { include: { owner: true } } }
      })

      if (!smartLock) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Smart lock not found'
        })
      }

      // Check permissions
      const hasAccess = smartLock.property.owner.userId === ctx.session.user.id ||
        ['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied'
        })
      }

      try {
        let success = false
        const eventType = input.action === 'unlock' ? 'UNLOCK' : 'LOCK'

        if (input.action === 'unlock') {
          success = await ttlockService.unlockRemotely({
            lockId: smartLock.ttlockId,
            reason: input.reason
          })
        } else {
          success = await ttlockService.lockRemotely(smartLock.ttlockId)
        }

        // Log the remote access
        const accessLog = await ctx.db.accessLog.create({
          data: {
            smartLockId: input.smartLockId,
            propertyId: smartLock.propertyId,
            eventType: success ? eventType : (eventType === 'UNLOCK' ? 'UNLOCK_FAILED' : 'LOCK_FAILED'),
            accessMethod: 'REMOTE',
            accessedBy: ctx.session.user.id,
            accessedByType: 'USER',
            success,
            notes: input.reason || `Remote ${input.action} via admin panel`
          }
        })

        // Update lock status if successful
        if (success) {
          await ctx.db.smartLock.update({
            where: { id: input.smartLockId },
            data: {
              lockStatus: input.action === 'unlock' ? 'UNLOCKED' : 'LOCKED',
              lastHeartbeat: new Date()
            }
          })
        }

        return {
          success,
          action: input.action,
          accessLog
        }
      } catch (error) {
        console.error(`Failed to ${input.action} remotely:`, error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to ${input.action} lock remotely`
        })
      }
    }),

  /**
   * Get access logs with filtering
   */
  getAccessLogs: protectedProcedure
    .input(accessLogFilterSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {}

      // Build where clause based on filters
      if (input.smartLockId) {
        where.smartLockId = input.smartLockId
      }

      if (input.propertyId) {
        where.propertyId = input.propertyId
      } else {
        // Only show logs for properties user has access to
        const userProperties = await ctx.db.property.findMany({
          where: {
            OR: [
              { ownerId: ctx.session.user.id },
              { owner: { userId: ctx.session.user.id } }
            ]
          },
          select: { id: true }
        })
        where.propertyId = { in: userProperties.map(p => p.id) }
      }

      if (input.startDate || input.endDate) {
        where.eventTimestamp = {}
        if (input.startDate) where.eventTimestamp.gte = input.startDate
        if (input.endDate) where.eventTimestamp.lte = input.endDate
      }

      if (input.eventType) {
        where.eventType = input.eventType
      }

      if (input.accessedBy) {
        where.accessedBy = input.accessedBy
      }

      if (input.flagged !== undefined) {
        where.flagged = input.flagged
      }

      const [logs, total] = await Promise.all([
        ctx.db.accessLog.findMany({
          where,
          include: {
            smartLock: {
              select: { id: true, lockName: true, location: true }
            },
            property: {
              select: { id: true, address: true, street: true, city: true }
            },
            accessCode: {
              select: { id: true, purpose: true, codeType: true }
            }
          },
          orderBy: { eventTimestamp: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit
        }),
        ctx.db.accessLog.count({ where })
      ])

      return {
        logs,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit)
        }
      }
    })
})