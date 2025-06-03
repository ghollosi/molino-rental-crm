import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const userRouter = createTRPCRouter({
  // Debug endpoint to check current session
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      console.log('=== SESSION DEBUG ===')
      console.log('Session user:', ctx.session.user)
      
      try {
        const dbUser = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            language: true,
          }
        })
        
        console.log('Database user:', dbUser)
        
        if (!dbUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session user not found in database. Please logout and login again.',
          })
        }
        
        return dbUser
      } catch (error) {
        console.error('Error fetching current user:', error)
        throw error
      }
    }),

  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'SERVICE_MANAGER', 'PROVIDER', 'TENANT']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions - only ADMIN, EDITOR_ADMIN, and OFFICE_ADMIN can list all users
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Csak adminisztrátorok férhetnek hozzá a felhasználók listájához',
        })
      }

      const { page, limit, search, role } = input
      const skip = (page - 1) * limit

      const where = {
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
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
            firstName: true,
            lastName: true,
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
      if (ctx.session.user.id !== input && !['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input },
        select: {
          id: true,
          firstName: true,
          lastName: true,
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
      firstName: z.string().optional(),
      lastName: z.string().optional(),
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
      if (ctx.session.user.id !== id && !['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
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
        // First check if the user exists
        const existingUser = await ctx.db.user.findUnique({
          where: { id },
          select: { id: true }
        })

        if (!existingUser) {
          console.error('User not found with ID:', id)
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          })
        }

        const user = await ctx.db.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        if (error instanceof TRPCError) {
          throw error
        }
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
      // Only full admins can change roles, EDITOR_ADMIN cannot create other admins
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Csak adminisztrátorok változtathatják meg a szerepköröket',
        })
      }

      // Special rule: Only ADMIN can create/modify OFFICE_ADMIN users
      if (input.role === 'OFFICE_ADMIN') {
        if (ctx.session.user.role !== 'ADMIN') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Csak főadminisztrátorok hozhatnak létre irodai adminokat',
          })
        }
      }

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          firstName: true,
          lastName: true,
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
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Csak adminisztrátorok aktiválhatják/inaktiválhatják a felhasználókat',
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
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          updatedAt: true,
        },
      })

      return updatedUser
    }),
})