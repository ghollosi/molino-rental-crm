import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { generatePassword, hashPassword } from '../../lib/password'
import { generateWelcomeEmail } from '../../lib/email-templates'
import { sendEmail } from '../../lib/email'

export const providerRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      specialty: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { page, limit, search, specialty } = input
      const skip = (page - 1) * limit

      const where: any = {}

      if (search) {
        where.OR = [
          { businessName: { contains: search, mode: 'insensitive' as const } },
          { user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }},
        ]
      }

      if (specialty) {
        where.specialty = {
          has: specialty,
        }
      }

      const [providers, total] = await Promise.all([
        ctx.db.provider.findMany({
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
                assignedIssues: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.provider.count({ where }),
      ])

      return {
        providers,
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
      const provider = await ctx.db.provider.findUnique({
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
          assignedIssues: {
            include: {
              property: {
                select: {
                  id: true,
                  street: true,
                  city: true,
                },
              },
              reportedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      })

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        })
      }

      // Check permissions - providers can only view their own profile
      if (ctx.session.user.role === 'PROVIDER' && provider.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return provider
    }),

  getByUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const provider = await ctx.db.provider.findUnique({
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
          assignedIssues: {
            include: {
              property: true,
              reportedBy: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      return provider
    }),

  create: protectedProcedure
    .input(z.object({
      userId: z.string(),
      businessName: z.string().min(1, 'Business name is required'),
      specialty: z.array(z.string()).min(1, 'At least one specialty is required'),
      hourlyRate: z.number().positive().optional(),
      currency: z.string().default('EUR'),
      availability: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Check if provider profile already exists
      const existingProvider = await ctx.db.provider.findUnique({
        where: { userId: input.userId },
      })

      if (existingProvider) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Provider profile already exists for this user',
        })
      }

      // Update user role to PROVIDER if not already
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: 'PROVIDER' },
      })

      const provider = await ctx.db.provider.create({
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

      return provider
    }),

  quickCreate: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      phone: z.string().optional(),
      businessName: z.string().min(1, 'Business name is required'),
      specialty: z.array(z.string()).min(1, 'At least one specialty is required'),
      hourlyRate: z.number().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
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
        // If user exists, check if they have a provider profile
        const existingProvider = await ctx.db.provider.findUnique({
          where: { userId: existingUser.id },
        })

        if (existingProvider) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A szolgáltató már létezik ezzel az email címmel',
          })
        }

        // Create provider profile for existing user
        const provider = await ctx.db.provider.create({
          data: {
            userId: existingUser.id,
            businessName: input.businessName,
            specialty: input.specialty,
            hourlyRate: input.hourlyRate,
            currency: 'EUR',
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
          data: { role: 'PROVIDER' },
        })

        return provider
      }

      // Generate temporary password
      const temporaryPassword = generatePassword(12)
      const hashedPassword = await hashPassword(temporaryPassword)

      // Create new user and provider profile
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: 'PROVIDER',
          password: hashedPassword,
        },
      })

      const provider = await ctx.db.provider.create({
        data: {
          userId: user.id,
          businessName: input.businessName,
          specialty: input.specialty,
          hourlyRate: input.hourlyRate,
          currency: 'EUR',
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
          role: 'PROVIDER',
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        }

        const { subject, html } = generateWelcomeEmail(emailData)
        
        await sendEmail({
          to: user.email,
          subject,
          html,
        })

        console.log(`Welcome email sent to new provider ${user.email}`)
      } catch (error) {
        console.error('Failed to send welcome email:', error)
        // Don't throw error - provider is already created
      }

      return provider
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
      providerData: z.object({
        businessName: z.string().optional(),
        specialty: z.array(z.string()).optional(),
        hourlyRate: z.number().positive().optional(),
        currency: z.string().optional(),
        availability: z.record(z.any()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, userId, userData, providerData } = input

      // Check permissions - providers can update their own profile
      const provider = await ctx.db.provider.findUnique({
        where: { id },
      })

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        })
      }

      if (ctx.session.user.role === 'PROVIDER' && provider.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own profile',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER', 'PROVIDER'].includes(ctx.session.user.role)) {
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

      // Update provider data
      const updatedProvider = await ctx.db.provider.update({
        where: { id },
        data: providerData,
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

      return updatedProvider
    }),

  updateRating: protectedProcedure
    .input(z.object({
      id: z.string(),
      rating: z.number().min(0).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const provider = await ctx.db.provider.update({
        where: { id: input.id },
        data: { rating: input.rating },
      })

      return provider
    }),

  getAvailableBySpecialty: protectedProcedure
    .input(z.string()) // specialty
    .query(async ({ ctx, input }) => {
      const providers = await ctx.db.provider.findMany({
        where: {
          specialty: {
            has: input,
          },
          user: {
            isActive: true,
          },
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
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'asc' },
        ],
      })

      return providers
    }),
})