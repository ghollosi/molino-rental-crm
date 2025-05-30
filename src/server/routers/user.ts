import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { generatePassword, hashPassword } from '../../lib/password'
import { generateWelcomeEmail, generateAdminNotificationEmail } from '../../lib/email-templates'
import { sendEmail } from '../../lib/email'

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['OWNER', 'TENANT', 'PROVIDER', 'ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN']),
  phone: z.string().optional(),
  language: z.enum(['HU', 'EN', 'ES']).default('HU'),
})

const CreateAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN']).default('ADMIN'),
  phone: z.string().optional(),
  language: z.enum(['HU', 'EN', 'ES']).default('HU'),
})

export const userRouter = createTRPCRouter({
  // List all users (admin only)
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'TENANT', 'PROVIDER']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Only admins can list users
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can list users',
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

  // Get user by ID (admin only)
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Only admins can view user details, or users can view their own profile
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role) && 
          ctx.session.user.id !== input) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
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
          owner: true,
          tenant: true,
          provider: true,
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

  // Create a new user (admin only)
  create: protectedProcedure
    .input(CreateUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Only admins can create users
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create users',
        })
      }

      // Check if email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists',
        })
      }

      // Generate temporary password
      const temporaryPassword = generatePassword(12)
      const hashedPassword = await hashPassword(temporaryPassword)

      // Create user
      const user = await ctx.db.user.create({
        data: {
          ...input,
          password: hashedPassword,
        },
      })

      // Send welcome email
      try {
        const emailData = {
          userName: user.name,
          email: user.email,
          temporaryPassword,
          role: user.role,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        }

        const { subject, html } = generateWelcomeEmail(emailData)
        
        await sendEmail({
          to: user.email,
          subject,
          html,
        })

        console.log(`Welcome email sent to ${user.email}`)
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail the user creation if email fails
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }
    }),

  // Create a new admin user (admin only)
  createAdmin: protectedProcedure
    .input(CreateAdminSchema)
    .mutation(async ({ ctx, input }) => {
      // Only admins can create admin users
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only main admins can create admin users',
        })
      }

      // Check if email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists',
        })
      }

      // Generate temporary password
      const temporaryPassword = generatePassword(12)
      const hashedPassword = await hashPassword(temporaryPassword)

      // Create admin user
      const newAdmin = await ctx.db.user.create({
        data: {
          ...input,
          password: hashedPassword,
        },
      })

      // Send welcome email to new admin
      try {
        const emailData = {
          userName: newAdmin.name,
          email: newAdmin.email,
          temporaryPassword,
          role: newAdmin.role,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        }

        const { subject, html } = generateWelcomeEmail(emailData)
        
        await sendEmail({
          to: newAdmin.email,
          subject,
          html,
        })

        console.log(`Welcome email sent to new admin ${newAdmin.email}`)
      } catch (emailError) {
        console.error('Failed to send welcome email to new admin:', emailError)
      }

      // Send notification to all existing admins
      try {
        const existingAdmins = await ctx.db.user.findMany({
          where: {
            role: { in: ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'] },
            isActive: true,
            id: { not: newAdmin.id }, // Don't send to the newly created admin
          },
          select: {
            email: true,
            name: true,
          },
        })

        const notificationData = {
          newAdminName: newAdmin.name,
          newAdminEmail: newAdmin.email,
          createdByName: ctx.session.user.name || 'Unknown',
          createdByEmail: ctx.session.user.email || 'Unknown',
        }

        const { subject: notifSubject, html: notifHtml } = generateAdminNotificationEmail(notificationData)

        // Send to all existing admins
        for (const admin of existingAdmins) {
          await sendEmail({
            to: admin.email,
            subject: notifSubject,
            html: notifHtml,
          })
        }

        console.log(`Admin notification emails sent to ${existingAdmins.length} admins`)
      } catch (emailError) {
        console.error('Failed to send admin notification emails:', emailError)
      }

      return {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        language: newAdmin.language,
        phone: newAdmin.phone,
        isActive: newAdmin.isActive,
        createdAt: newAdmin.createdAt,
      }
    }),

  // Update user (admin only, or user updating their own profile)
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        language: z.enum(['HU', 'EN', 'ES']).optional(),
        isActive: z.boolean().optional(),
        role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'TENANT', 'PROVIDER']).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input

      // Check permissions
      const isAdmin = ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)
      const isOwnProfile = ctx.session.user.id === id

      if (!isAdmin && !isOwnProfile) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      // Non-admins can't change role or isActive
      if (!isAdmin && (data.role || data.hasOwnProperty('isActive'))) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can change role or active status',
        })
      }

      // Check if email is already taken (if changing email)
      if (data.email) {
        const existingUser = await ctx.db.user.findFirst({
          where: {
            email: data.email,
            id: { not: id },
          },
        })

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists',
          })
        }
      }

      const updatedUser = await ctx.db.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          language: true,
          phone: true,
          isActive: true,
          updatedAt: true,
        },
      })

      return updatedUser
    }),

  // Delete user (admin only)
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only main admins can delete users
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only main admins can delete users',
        })
      }

      // Can't delete yourself
      if (ctx.session.user.id === input) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        })
      }

      // Check if user exists and get their relations
      const user = await ctx.db.user.findUnique({
        where: { id: input },
        include: {
          owner: { include: { properties: true } },
          tenant: { include: { contracts: true } },
          provider: { include: { assignedIssues: true } },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Check if user has related data that prevents deletion
      const hasProperties = (user.owner?.properties.length ?? 0) > 0
      const hasContracts = (user.tenant?.contracts.length ?? 0) > 0
      const hasAssignedIssues = (user.provider?.assignedIssues.length ?? 0) > 0

      if (hasProperties || hasContracts || hasAssignedIssues) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete user with related data. Please transfer or remove related records first.',
        })
      }

      // Delete user and related profiles
      await ctx.db.user.delete({
        where: { id: input },
      })

      return { success: true }
    }),

  // Reset user password (admin only)
  resetPassword: protectedProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can reset passwords
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can reset passwords',
        })
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Generate new temporary password
      const newPassword = generatePassword(12)
      const hashedPassword = await hashPassword(newPassword)

      // Update user password
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { password: hashedPassword },
      })

      // Send email with new password
      try {
        const emailData = {
          userName: user.name,
          email: user.email,
          temporaryPassword: newPassword,
          role: user.role,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        }

        const { subject, html } = generateWelcomeEmail(emailData)
        
        await sendEmail({
          to: user.email,
          subject: 'Jelszó visszaállítva - Molino RENTAL CRM',
          html,
        })

        console.log(`Password reset email sent to ${user.email}`)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password reset but failed to send email',
        })
      }

      return { success: true }
    }),
})