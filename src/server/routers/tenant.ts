import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const tenantRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { page, limit, search, isActive } = input
      const skip = (page - 1) * limit

      const where: any = {}

      if (search) {
        where.user = {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      }

      if (isActive !== undefined) {
        where.isActive = isActive
      }

      const [tenants, total] = await Promise.all([
        ctx.db.tenant.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
            properties: {
              select: {
                id: true,
                street: true,
                city: true,
                type: true,
                status: true,
              },
            },
            _count: {
              select: {
                contracts: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.tenant.count({ where }),
      ])

      return {
        tenants,
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
      const tenant = await ctx.db.tenant.findUnique({
        where: { id: input },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
            },
          },
          properties: {
            include: {
              owner: { include: { user: true } },
            },
          },
          contracts: {
            include: {
              property: {
                include: {
                  owner: { include: { user: true } },
                },
              },
            },
            orderBy: { startDate: 'desc' },
          },
        },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      // Check permissions - tenants can only view their own profile
      if (ctx.session.user.role === 'TENANT' && tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return tenant
    }),

  getByUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({
        where: { userId: input },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          properties: {
            include: {
              owner: { include: { user: true } },
            },
          },
          contracts: {
            include: {
              property: true,
            },
            orderBy: { startDate: 'desc' },
          },
        },
      })

      return tenant
    }),

  create: protectedProcedure
    .input(z.object({
      userId: z.string(),
      emergencyName: z.string().optional(),
      emergencyPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Check if tenant profile already exists
      const existingTenant = await ctx.db.tenant.findUnique({
        where: { userId: input.userId },
      })

      if (existingTenant) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tenant profile already exists for this user',
        })
      }

      // Update user role to TENANT if not already
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: 'TENANT' },
      })

      const tenant = await ctx.db.tenant.create({
        data: input,
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
      })

      return tenant
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      userData: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        phone: z.string().optional(),
      }),
      tenantData: z.object({
        emergencyName: z.string().optional(),
        emergencyPhone: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, userId, userData, tenantData } = input

      // Check permissions - tenants can update their own profile
      const tenant = await ctx.db.tenant.findUnique({
        where: { id },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      if (ctx.session.user.role === 'TENANT' && tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own profile',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Update user data
      await ctx.db.user.update({
        where: { id: userId },
        data: userData,
      })

      // Update tenant data
      const updatedTenant = await ctx.db.tenant.update({
        where: { id },
        data: tenantData,
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
      })

      return updatedTenant
    }),

  assignToProperty: protectedProcedure
    .input(z.object({
      tenantId: z.string(),
      propertyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Update property to have current tenant
      const property = await ctx.db.property.update({
        where: { id: input.propertyId },
        data: {
          currentTenantId: input.tenantId,
          status: 'RENTED',
        },
      })

      return property
    }),

  removeFromProperty: protectedProcedure
    .input(z.string()) // propertyId
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Update property to remove current tenant
      const property = await ctx.db.property.update({
        where: { id: input },
        data: {
          currentTenantId: null,
          status: 'AVAILABLE',
        },
      })

      return property
    }),
})