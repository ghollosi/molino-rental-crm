import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const PropertyCreateSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  ownerId: z.string(),
  type: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL']),
  size: z.number().positive().optional(),
  rooms: z.number().int().positive().optional(),
  floor: z.number().int().optional(),
  rentAmount: z.number().positive().optional(),
  currency: z.string().default('EUR'),
  photos: z.array(z.string()).optional().default([]),
  // Új mezők
  shortTermRental: z.boolean().default(false),
  longTermRental: z.boolean().default(true),
  licenseRequired: z.boolean().default(false),
})

export const propertyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE']).optional(),
      ownerId: z.string().optional(),
      type: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, ownerId, type } = input
      const skip = (page - 1) * limit

      // Build where clause based on user role
      let where: any = {}

      // If user is an owner, only show their properties
      if (ctx.session.user.role === 'OWNER') {
        const owner = await ctx.db.owner.findUnique({
          where: { userId: ctx.session.user.id },
        })
        if (owner) {
          where.ownerId = owner.id
        } else {
          // Owner profile doesn't exist yet, return empty
          return {
            properties: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          }
        }
      }

      // Add search filters
      if (search) {
        where.OR = [
          { street: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      if (status) where.status = status
      if (ownerId) where.ownerId = ownerId
      if (type) where.type = type

      const [properties, total] = await Promise.all([
        ctx.db.property.findMany({
          where,
          skip,
          take: limit,
          include: {
            owner: { include: { user: true } },
            currentTenant: { include: { user: true } },
            _count: {
              select: {
                issues: true,
                offers: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.property.count({ where }),
      ])

      return {
        properties,
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
      const property = await ctx.db.property.findUnique({
        where: { id: input },
        include: {
          owner: { include: { user: true } },
          currentTenant: { include: { user: true } },
          issues: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              reportedBy: true,
              assignedTo: { include: { user: true } },
            },
          },
          contracts: {
            orderBy: { startDate: 'desc' },
            include: {
              tenant: { include: { user: true } },
            },
          },
          offers: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              createdBy: true,
              issue: true,
            },
          },
        },
      })

      if (!property) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Property not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'OWNER') {
        const owner = await ctx.db.owner.findUnique({
          where: { userId: ctx.session.user.id },
        })
        if (!owner || property.ownerId !== owner.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          })
        }
      }

      return property
    }),

  create: protectedProcedure
    .input(PropertyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const property = await ctx.db.property.create({
        data: input,
        include: {
          owner: { include: { user: true } },
        },
      })

      return property
    }),

  updateOld: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: PropertyCreateSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const property = await ctx.db.property.update({
        where: { id: input.id },
        data: input.data,
        include: {
          owner: { include: { user: true } },
          currentTenant: { include: { user: true } },
        },
      })

      return property
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const property = await ctx.db.property.update({
        where: { id: input.id },
        data: { status: input.status },
      })

      return property
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete properties
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete properties',
        })
      }

      await ctx.db.property.delete({
        where: { id: input },
      })

      return { success: true }
    }),

  uploadPhotos: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      photos: z.array(z.string().url()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const property = await ctx.db.property.update({
        where: { id: input.propertyId },
        data: {
          photos: { push: input.photos },
        },
      })

      return property
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      type: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL']),
      size: z.number().positive().optional(),
      rooms: z.number().int().positive().optional(),
      floor: z.number().int().optional(),
      rentAmount: z.number().positive().optional(),
      currency: z.string().default('EUR'),
      status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE']).optional(),
      description: z.string().optional(),
      photos: z.array(z.string()).optional(),
      // Új mezők
      shortTermRental: z.boolean().optional(),
      longTermRental: z.boolean().optional(),
      licenseRequired: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check permissions
      const property = await ctx.db.property.findUnique({
        where: { id },
        include: { owner: true },
      })

      if (!property) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Property not found',
        })
      }

      // Owners can only update their own properties
      if (ctx.session.user.role === 'OWNER') {
        if (property.owner.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update your own properties',
          })
        }
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const updatedProperty = await ctx.db.property.update({
        where: { id },
        data,
        include: {
          owner: {
            include: { user: true },
          },
          currentTenant: {
            include: { user: true },
          },
        },
      })

      return updatedProperty
    }),
})