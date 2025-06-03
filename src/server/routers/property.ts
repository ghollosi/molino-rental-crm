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

      // Role-based filtering
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
      } else if (ctx.session.user.role === 'TENANT') {
        // Tenants only see properties they are assigned to
        const tenant = await ctx.db.tenant.findUnique({
          where: { userId: ctx.session.user.id },
          include: { properties: { select: { id: true } } },
        })
        if (tenant && tenant.properties.length > 0) {
          where.id = { in: tenant.properties.map(p => p.id) }
        } else {
          // No assigned properties, return empty
          return {
            properties: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          }
        }
      } else if (ctx.session.user.role === 'PROVIDER') {
        // Providers only see properties where they have assigned issues
        const provider = await ctx.db.provider.findUnique({
          where: { userId: ctx.session.user.id },
          include: {
            assignedIssues: {
              select: { propertyId: true },
            },
          },
        })
        if (provider && provider.assignedIssues.length > 0) {
          const propertyIds = [...new Set(provider.assignedIssues.map(issue => issue.propertyId))]
          where.id = { in: propertyIds }
        } else {
          // No assigned issues, return empty
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

      // Build include object based on user role
      let include: any = {
        _count: {
          select: {
            issues: true,
            offers: true,
          },
        },
      }

      // Providers should not see owner details for privacy
      if (ctx.session.user.role === 'PROVIDER') {
        include.currentTenant = { include: { user: { select: { firstName: true, lastName: true, email: true } } } }
        // Owner details are excluded for providers
      } else {
        include.owner = { include: { user: true } }
        include.currentTenant = { include: { user: true } }
      }

      const [properties, total] = await Promise.all([
        ctx.db.property.findMany({
          where,
          skip,
          take: limit,
          include,
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
      // Build include object based on user role
      let include: any = {
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
      }

      // Providers should not see owner details for privacy
      if (ctx.session.user.role === 'PROVIDER') {
        include.currentTenant = { include: { user: { select: { firstName: true, lastName: true, email: true } } } }
        // Owner details are excluded for providers
      } else {
        include.owner = { include: { user: true } }
        include.currentTenant = { include: { user: true } }
      }

      const property = await ctx.db.property.findUnique({
        where: { id: input },
        include,
      })

      if (!property) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Property not found',
        })
      }

      // Role-based permission checks
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
      } else if (ctx.session.user.role === 'TENANT') {
        const tenant = await ctx.db.tenant.findUnique({
          where: { userId: ctx.session.user.id },
          include: { properties: { select: { id: true } } },
        })
        if (!tenant || !tenant.properties.some(p => p.id === property.id)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          })
        }
      } else if (ctx.session.user.role === 'PROVIDER') {
        const provider = await ctx.db.provider.findUnique({
          where: { userId: ctx.session.user.id },
          include: {
            assignedIssues: {
              select: { propertyId: true },
            },
          },
        })
        if (!provider || !provider.assignedIssues.some(issue => issue.propertyId === property.id)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          })
        }
      }
      // ADMIN, EDITOR_ADMIN, OFFICE_ADMIN, SERVICE_MANAGER can access all properties

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

  update: protectedProcedure
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

})