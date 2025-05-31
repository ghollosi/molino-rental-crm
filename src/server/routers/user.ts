import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const userRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'SERVICE_MANAGER', 'PROVIDER', 'TENANT']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { page, limit, search, role } = input
      const skip = (page - 1) * limit

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(role && { role }),
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            language: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.user.count({ where }),
      ])

      return {
        users,
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
      // Users can only view their own profile or admins can view any
      if (ctx.session.user.id !== input && !['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          language: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            include: {
              properties: {
                take: 5,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          tenant: {
            include: {
              properties: {
                take: 5,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
          provider: {
            include: {
              assignedIssues: {
                take: 5,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      return user
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      language: z.enum(['HU', 'EN']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      console.log('=== USER UPDATE BACKEND DEBUG ===')
      console.log('Input:', input)
      console.log('Session user ID:', ctx.session.user.id)
      console.log('Target user ID:', id)
      console.log('Session user role:', ctx.session.user.role)

      // Users can only update their own profile or admins can update any
      if (ctx.session.user.id !== id && !['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        console.error('Permission denied - user trying to update different user')
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Remove undefined values
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      )

      console.log('Filtered update data:', updateData)

      try {
        const user = await ctx.db.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            language: true,
            role: true,
            updatedAt: true,
          },
        })

        console.log('Database update successful:', user)
        return user
      } catch (error) {
        console.error('Database update failed:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user',
        })
      }
    }),

  updateRole: protectedProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'SERVICE_MANAGER', 'PROVIDER', 'TENANT']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can change roles
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can change user roles',
        })
      }

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          updatedAt: true,
        },
      })

      return user
    }),

  toggleActive: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only admins can activate/deactivate users
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can activate/deactivate users',
        })
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input },
        select: { isActive: true },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input },
        data: { isActive: !user.isActive },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          updatedAt: true,
        },
      })

      return updatedUser
    }),
})