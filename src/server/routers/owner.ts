import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { generatePassword, hashPassword } from '../../lib/password'
import { generateWelcomeEmail } from '../../lib/email-templates'
import { sendEmail } from '../../lib/email'

export const ownerRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      isCompany: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { page, limit, search, isCompany } = input
      const skip = (page - 1) * limit

      let where: any = {}
      
      if (search) {
        where.user = {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      }
      
      if (isCompany !== undefined) {
        where.isCompany = isCompany
      }

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

  quickCreate: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Password must be at least 6 characters').optional(),
      phone: z.string().optional(),
      taxNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Check if user with this email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        // If user exists, check if they have an owner profile
        const existingOwner = await ctx.db.owner.findUnique({
          where: { userId: existingUser.id },
        })

        if (existingOwner) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A tulajdonos már létezik ezzel az email címmel',
          })
        }

        // Create owner profile for existing user
        const owner = await ctx.db.owner.create({
          data: {
            userId: existingUser.id,
            taxNumber: input.taxNumber,
          },
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

        // Update user role
        await ctx.db.user.update({
          where: { id: existingUser.id },
          data: { role: 'OWNER' },
        })

        return owner
      }

      // Use provided password or generate temporary one
      const temporaryPassword = input.password || generatePassword(12)
      const hashedPassword = await hashPassword(temporaryPassword)

      // Create new user and owner profile
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: 'OWNER',
          password: hashedPassword,
        },
      })

      const owner = await ctx.db.owner.create({
        data: {
          userId: user.id,
          taxNumber: input.taxNumber,
        },
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

      // Send welcome email with temporary password
      try {
        const emailData = {
          userName: user.name,
          email: user.email,
          temporaryPassword,
          role: 'OWNER',
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        }

        const { subject, html } = generateWelcomeEmail(emailData)
        
        await sendEmail({
          to: user.email,
          subject,
          html,
        })

        console.log(`Welcome email sent to new owner ${user.email}`)
      } catch (error) {
        console.error('Failed to send welcome email:', error)
        // Don't throw error - owner is already created
      }

      return owner
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
      ownerData: z.object({
        taxNumber: z.string().optional(),
        companyName: z.string().optional(),
        isCompany: z.boolean().optional(),
        bankAccount: z.string().optional(),
        billingStreet: z.string().optional(),
        billingCity: z.string().optional(),
        billingPostalCode: z.string().optional(),
        billingCountry: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, userId, userData, ownerData } = input

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

      // Update user data
      await ctx.db.user.update({
        where: { id: userId },
        data: userData,
      })

      // Update owner data
      const updatedOwner = await ctx.db.owner.update({
        where: { id },
        data: ownerData,
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