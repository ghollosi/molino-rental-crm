import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { Decimal } from '@prisma/client/runtime/library'

export const contractRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'PENDING']).optional(),
      propertyId: z.string().optional(),
      tenantId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, propertyId, tenantId } = input
      const skip = (page - 1) * limit

      const where: Record<string, unknown> = {}

      if (propertyId) {
        where.propertyId = propertyId
      }

      if (tenantId) {
        where.tenantId = tenantId
      }

      if (search) {
        where.OR = [
          { property: { street: { contains: search, mode: 'insensitive' as const } } },
          { property: { city: { contains: search, mode: 'insensitive' as const } } },
          { tenant: { user: { name: { contains: search, mode: 'insensitive' as const } } } },
          { id: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      // Handle status filtering including computed expired status
      if (status) {
        const now = new Date()
        if (status === 'EXPIRED') {
          where.endDate = { lt: now }
        } else if (status === 'ACTIVE') {
          where.AND = [
            { startDate: { lte: now } },
            { endDate: { gte: now } },
          ]
        }
        // For TERMINATED and PENDING, we'd need a status field in the schema
      }

      const [contracts, total] = await Promise.all([
        ctx.db.contract.findMany({
          where,
          skip,
          take: limit,
          include: {
            property: {
              select: {
                id: true,
                street: true,
                city: true,
                type: true,
              },
            },
            tenant: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.contract.count({ where }),
      ])

      // Add computed status to contracts
      const contractsWithStatus = contracts.map(contract => {
        const now = new Date()
        let computedStatus = 'ACTIVE'
        if (contract.endDate < now) {
          computedStatus = 'EXPIRED'
        } else if (contract.startDate > now) {
          computedStatus = 'PENDING'
        }
        return {
          ...contract,
          status: computedStatus,
          rentAmount: contract.rentAmount.toNumber(),
          deposit: contract.deposit?.toNumber() || null,
        }
      })

      return {
        contracts: contractsWithStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const contract = await ctx.db.contract.findUnique({
        where: { id: input },
        include: {
          property: {
            include: {
              owner: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          tenant: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      })

      if (!contract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found',
        })
      }

      // Compute status
      const now = new Date()
      let status = 'ACTIVE'
      if (contract.endDate < now) {
        status = 'EXPIRED'
      } else if (contract.startDate > now) {
        status = 'PENDING'
      }

      return {
        ...contract,
        status,
        rentAmount: contract.rentAmount.toNumber(),
        deposit: contract.deposit?.toNumber() || null,
      }
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      tenantId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
      rentAmount: z.number().positive(),
      deposit: z.number().positive().optional(),
      paymentDay: z.number().min(1).max(31),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Validate dates
      if (input.startDate >= input.endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'End date must be after start date',
        })
      }

      // Check if property is available
      const property = await ctx.db.property.findUnique({
        where: { id: input.propertyId },
      })

      if (!property) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Property not found',
        })
      }

      // Check for overlapping contracts
      const overlapping = await ctx.db.contract.findFirst({
        where: {
          propertyId: input.propertyId,
          OR: [
            {
              AND: [
                { startDate: { lte: input.startDate } },
                { endDate: { gte: input.startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: input.endDate } },
                { endDate: { gte: input.endDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: input.startDate } },
                { endDate: { lte: input.endDate } },
              ],
            },
          ],
        },
      })

      if (overlapping) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'There is already a contract for this property in the specified period',
        })
      }

      const contract = await ctx.db.contract.create({
        data: {
          ...input,
          rentAmount: new Decimal(input.rentAmount),
          deposit: input.deposit ? new Decimal(input.deposit) : null,
        },
        include: {
          property: true,
          tenant: {
            include: {
              user: true,
            },
          },
        },
      })

      // Update property status to RENTED
      await ctx.db.property.update({
        where: { id: input.propertyId },
        data: { status: 'RENTED' },
      })

      return {
        ...contract,
        rentAmount: contract.rentAmount.toNumber(),
        deposit: contract.deposit?.toNumber() || null,
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      rentAmount: z.number().positive().optional(),
      deposit: z.number().positive().optional(),
      paymentDay: z.number().min(1).max(31).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const existing = await ctx.db.contract.findUnique({
        where: { id },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found',
        })
      }

      // Validate dates if provided
      const startDate = data.startDate || existing.startDate
      const endDate = data.endDate || existing.endDate
      
      if (startDate >= endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'End date must be after start date',
        })
      }

      const updateData: Record<string, unknown> = {}
      if (data.startDate) updateData.startDate = data.startDate
      if (data.endDate) updateData.endDate = data.endDate
      if (data.rentAmount) updateData.rentAmount = new Decimal(data.rentAmount)
      if (data.deposit) updateData.deposit = new Decimal(data.deposit)
      if (data.paymentDay) updateData.paymentDay = data.paymentDay

      const contract = await ctx.db.contract.update({
        where: { id },
        data: updateData,
        include: {
          property: true,
          tenant: {
            include: {
              user: true,
            },
          },
        },
      })

      return {
        ...contract,
        rentAmount: contract.rentAmount.toNumber(),
        deposit: contract.deposit?.toNumber() || null,
      }
    }),

  terminate: protectedProcedure
    .input(z.object({
      id: z.string(),
      terminationDate: z.date(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
      })

      if (!contract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found',
        })
      }

      // Update contract end date
      const updated = await ctx.db.contract.update({
        where: { id: input.id },
        data: {
          endDate: input.terminationDate,
        },
      })

      // Update property status back to AVAILABLE
      await ctx.db.property.update({
        where: { id: contract.propertyId },
        data: { status: 'AVAILABLE' },
      })

      return {
        ...updated,
        rentAmount: updated.rentAmount.toNumber(),
        deposit: updated.deposit?.toNumber() || null,
      }
    }),

  getUpcoming: protectedProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + input.days)

      const contracts = await ctx.db.contract.findMany({
        where: {
          endDate: {
            gte: new Date(),
            lte: futureDate,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              street: true,
              city: true,
            },
          },
          tenant: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { endDate: 'asc' },
      })

      return contracts.map(contract => ({
        ...contract,
        rentAmount: contract.rentAmount.toNumber(),
        deposit: contract.deposit?.toNumber() || null,
      }))
    }),
})