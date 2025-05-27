import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const ownerRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { page, limit, search } = input
      const skip = (page - 1) * limit

      const where = search ? {
        user: {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        },
      } : {}

      const [owners, total] = await Promise.all([
        ctx.db.owner.findMany({
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
            _count: {
              select: {
                properties: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.owner.count({ where }),
      ])

      return {
        owners,
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
      const owner = await ctx.db.owner.findUnique({
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
              currentTenant: { include: { user: true } },
              _count: {
                select: {
                  issues: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!owner) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Owner not found',
        })
      }

      // Check permissions - owners can only view their own profile
      if (ctx.session.user.role === 'OWNER' && owner.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return owner
    }),

  getByUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const owner = await ctx.db.owner.findUnique({
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
              currentTenant: { include: { user: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      return owner
    }),

  create: protectedProcedure
    .input(z.object({
      userId: z.string(),
      taxNumber: z.string().optional(),
      bankAccount: z.string().optional(),
      billingStreet: z.string().optional(),
      billingCity: z.string().optional(),
      billingPostalCode: z.string().optional(),
      billingCountry: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Check if owner profile already exists
      const existingOwner = await ctx.db.owner.findUnique({
        where: { userId: input.userId },
      })

      if (existingOwner) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Owner profile already exists for this user',
        })
      }

      // Update user role to OWNER if not already
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: 'OWNER' },
      })

      const owner = await ctx.db.owner.create({
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

      return owner
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      taxNumber: z.string().optional(),
      bankAccount: z.string().optional(),
      billingStreet: z.string().optional(),
      billingCity: z.string().optional(),
      billingPostalCode: z.string().optional(),
      billingCountry: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check permissions - owners can update their own profile
      const owner = await ctx.db.owner.findUnique({
        where: { id },
      })

      if (!owner) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Owner not found',
        })
      }

      if (ctx.session.user.role === 'OWNER' && owner.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own profile',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const updatedOwner = await ctx.db.owner.update({
        where: { id },
        data,
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

      return updatedOwner
    }),
})