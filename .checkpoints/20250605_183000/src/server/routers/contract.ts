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
          { tenant: { user: { firstName: { contains: search, mode: 'insensitive' as const } } } },
          { tenant: { user: { lastName: { contains: search, mode: 'insensitive' as const } } } },
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
                    firstName: true,
                    lastName: true,
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
                      firstName: true,
                      lastName: true,
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
                  firstName: true,
                  lastName: true,
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
      rentalType: z.enum(['SHORT_TERM', 'LONG_TERM']).default('LONG_TERM'),
      startDate: z.date(),
      endDate: z.date(),
      rentAmount: z.number().positive(),
      deposit: z.number().positive().optional(),
      paymentDay: z.number().min(1).max(31),
      templateId: z.string().optional(),
      content: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED']).default('ACTIVE'),
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

      let contractContent = input.content

      // If template is selected, generate content from template
      if (input.templateId) {
        const template = await ctx.db.contractTemplate.findUnique({
          where: { id: input.templateId },
        })

        if (template && template.isActive) {
          // Get property and tenant details for template variables
          const [propertyDetails, tenantDetails] = await Promise.all([
            ctx.db.property.findUnique({
              where: { id: input.propertyId },
              include: { owner: { include: { user: true } } },
            }),
            ctx.db.tenant.findUnique({
              where: { id: input.tenantId },
              include: { user: true },
            }),
          ])

          // Replace template variables with actual data
          contractContent = template.content
          const variables = template.variables as Array<{key: string}>

          // Common replacements
          const replacements: Record<string, string> = {
            ingatlan_cim: `${propertyDetails?.street}, ${propertyDetails?.city} ${propertyDetails?.postalCode}`,
            ingatlan_alapterulet: propertyDetails?.size?.toString() || '',
            ingatlan_szobaszam: propertyDetails?.rooms?.toString() || '',
            berlo_nev: `${tenantDetails?.user.firstName} ${tenantDetails?.user.lastName}`,
            berlo_lakcim: tenantDetails?.user.email || '', // Would need address field
            berleti_dij: input.rentAmount.toString(),
            berleti_dij_szoveg: input.rentAmount.toLocaleString('hu-HU'),
            kaucio: input.deposit?.toString() || '0',
            kaucio_szoveg: input.deposit?.toLocaleString('hu-HU') || 'nincs',
            kezdo_datum: input.startDate.toLocaleDateString('hu-HU'),
            veg_datum: input.endDate.toLocaleDateString('hu-HU'),
            fizetes_napja: input.paymentDay.toString(),
            tulajdonos_nev: `${propertyDetails?.owner?.user.firstName} ${propertyDetails?.owner?.user.lastName}`,
          }

          // Replace all variables
          Object.entries(replacements).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g')
            contractContent = contractContent?.replace(regex, value) || ''
          })
        }
      }

      const contract = await ctx.db.contract.create({
        data: {
          ...input,
          rentAmount: new Decimal(input.rentAmount),
          deposit: input.deposit ? new Decimal(input.deposit) : null,
          templateId: input.templateId,
          content: contractContent,
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

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete contracts
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete contracts',
        })
      }

      // Check if contract exists
      const contract = await ctx.db.contract.findUnique({
        where: { id: input },
      })

      if (!contract) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contract not found',
        })
      }

      // Check if contract is active - prevent deletion of active contracts
      if (contract.status === 'ACTIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete active contract. Please terminate the contract first.',
        })
      }

      await ctx.db.contract.delete({
        where: { id: input },
      })

      return { success: true }
    }),

  getByProperty: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const contracts = await ctx.db.contract.findMany({
        where: {
          propertyId: input.propertyId,
        },
        include: {
          tenant: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          property: {
            select: {
              id: true,
              street: true,
              city: true,
            },
          },
        },
        orderBy: [
          { status: 'desc' }, // Active contracts first
          { startDate: 'desc' },
        ],
      })

      return contracts
    }),
})