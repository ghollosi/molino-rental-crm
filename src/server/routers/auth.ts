import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'SERVICE_MANAGER', 'PROVIDER', 'TENANT']).default('TENANT'),
  language: z.enum(['HU', 'EN', 'ES']).default('HU'),
})

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email, password, role, language } = input

      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User with this email already exists',
        })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      const user = await ctx.db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          language,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          language: true,
          createdAt: true,
        },
      })

      return user
    }),

  getSession: protectedProcedure.query(({ ctx }) => {
    return ctx.session
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      language: z.enum(['HU', 'EN', 'ES']).optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          language: true,
          phone: true,
          updatedAt: true,
        },
      })

      return user
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.password)

      if (!isCurrentPasswordValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect',
        })
      }

      const hashedNewPassword = await bcrypt.hash(input.newPassword, 12)

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedNewPassword },
      })

      return { success: true }
    }),
})