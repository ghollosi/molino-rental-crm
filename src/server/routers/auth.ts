import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { sendEmail } from '@/lib/email'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'SERVICE_MANAGER', 'PROVIDER', 'TENANT']).default('TENANT'),
  language: z.enum(['HU', 'EN', 'ES']).default('HU'),
})

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { firstName, lastName, email, password, role, language } = input

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
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role,
          language,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
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
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      language: z.enum(['HU', 'EN', 'ES']).optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          firstName: true,
          lastName: true,
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

  forgotPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      // Biztonsági okokból mindig sikert jelzünk, akkor is ha nem létezik a user
      if (!user) {
        return { success: true }
      }

      // Token generálás
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 óra

      // Token mentése
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      })

      // Email küldése
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
      
      await sendEmail({
        to: user.email,
        subject: 'Jelszó visszaállítás - Molino CRM',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Jelszó visszaállítás</h2>
            <p>Kedves ${user.firstName || 'Felhasználó'}!</p>
            <p>Az alábbi linkre kattintva állíthatja be az új jelszavát:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Új jelszó beállítása
            </a>
            <p>Vagy másolja be ezt a linket a böngészőjébe:</p>
            <p>${resetUrl}</p>
            <p><strong>Ez a link 1 óráig érvényes.</strong></p>
            <p>Ha nem Ön kérte a jelszó visszaállítást, kérjük hagyja figyelmen kívül ezt a levelet.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">Üdvözlettel,<br>Molino CRM csapat</p>
          </div>
        `,
      })

      return { success: true }
    }),

  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      // Token ellenőrzés
      const user = await ctx.db.user.findFirst({
        where: {
          resetToken: input.token,
          resetTokenExpiry: {
            gt: new Date(),
          },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Érvénytelen vagy lejárt token',
        })
      }

      // Új jelszó mentése
      const hashedPassword = await bcrypt.hash(input.password, 12)

      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })

      // Értesítő email
      await sendEmail({
        to: user.email,
        subject: 'Jelszó sikeresen megváltoztatva - Molino CRM',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Jelszó megváltoztatva</h2>
            <p>Kedves ${user.firstName || 'Felhasználó'}!</p>
            <p>Az Ön jelszava sikeresen megváltoztatásra került.</p>
            <p>Ha nem Ön változtatta meg a jelszavát, kérjük azonnal lépjen kapcsolatba velünk!</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
            <p style="color: #666; font-size: 14px;">Üdvözlettel,<br>Molino CRM csapat</p>
          </div>
        `,
      })

      return { success: true }
    }),
})