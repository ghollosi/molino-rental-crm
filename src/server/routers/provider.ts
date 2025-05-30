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
      businessName: z.string().min(1, 'Business name is required'),
      contactName: z.string().min(1, 'Contact name is required'),
      contactEmail: z.string().email('Invalid email'),
      contactPhone: z.string().min(1, 'Contact phone is required'),
      specialty: z.array(z.string()).min(1, 'At least one specialty is required'),
      hourlyRate: z.number().positive().optional(),
      travelCostPerKm: z.number().positive().optional(),
      currency: z.string().default('EUR'),
      companyDetails: z.string().optional(),
      referenceSource: z.string().optional(),
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

      // Check if provider with this email already exists
      const existingProvider = await ctx.db.provider.findFirst({
        where: { contactEmail: input.contactEmail },
      })

      if (existingProvider) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Provider with this email already exists',
        })
      }

      // Generate invite token
      const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const provider = await ctx.db.provider.create({
        data: {
          ...input,
          inviteToken,
          invitedAt: new Date(),
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

  createInvitation: protectedProcedure
    .input(z.object({
      businessName: z.string().min(1, 'Business name is required'),
      contactName: z.string().min(1, 'Contact name is required'),
      contactEmail: z.string().email('Invalid email'),
      contactPhone: z.string().optional(),
      specialty: z.array(z.string()).min(1, 'At least one specialty is required'),
      companyDetails: z.string().optional(),
      referenceSource: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Generate unique invitation token
      const inviteToken = `invite_${Date.now()}_${Math.random().toString(36).substring(2)}`
      
      // Create provider record with invitation data
      const provider = await ctx.db.provider.create({
        data: {
          businessName: input.businessName,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          specialty: input.specialty,
          companyDetails: input.companyDetails,
          referenceSource: input.referenceSource,
          inviteToken,
          invitedAt: new Date(),
          isVerified: false,
        },
      })

      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/provider-register?token=${inviteToken}`

      return {
        provider,
        inviteLink,
        inviteToken,
      }
    }),

  sendInvitation: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      inviteLink: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Szolgáltató regisztráció - Molino Rental CRM</h2>
            
            <p>Kedves ${input.name}!</p>
            
            <p>Meghívást kaptál a Molino Rental CRM szolgáltató hálózatába való csatlakozásra.</p>
            
            <p>Az alábbi linkre kattintva tudod befejezni a regisztrációt:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${input.inviteLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Regisztráció befejezése
              </a>
            </div>
            
            <p>A link 7 napig érvényes.</p>
            
            <p>Ha nem kértél ilyen meghívót, kérjük figyelmen kívül hagyni ezt az emailt.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Ez egy automatikusan generált email. Kérjük, ne válaszolj rá.
            </p>
          </div>
        `

        await sendEmail({
          to: input.email,
          subject: 'Szolgáltató regisztráció - Molino Rental CRM',
          html: emailHtml,
        })

        console.log(`Invitation email sent to ${input.email}`)
        return { success: true }
      } catch (error) {
        console.error('Failed to send invitation email:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send invitation email',
        })
      }
    }),

  getByInviteToken: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const provider = await ctx.db.provider.findUnique({
        where: { inviteToken: input },
      })

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired invitation token',
        })
      }

      // Check if invitation is still valid (7 days)
      const invitedAt = provider.invitedAt
      if (!invitedAt || (Date.now() - invitedAt.getTime()) > 7 * 24 * 60 * 60 * 1000) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation has expired',
        })
      }

      return provider
    }),

  completeRegistration: protectedProcedure
    .input(z.object({
      token: z.string(),
      userData: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
        phone: z.string().optional(),
        password: z.string().min(6, 'Password must be at least 6 characters'),
      }),
      providerData: z.object({
        hourlyRate: z.number().optional(),
        travelCostPerKm: z.number().optional(),
        availability: z.record(z.boolean()).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find provider by token
      const provider = await ctx.db.provider.findUnique({
        where: { inviteToken: input.token },
      })

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid invitation token',
        })
      }

      // Check if already registered
      if (provider.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Provider already registered',
        })
      }

      // Check if invitation is still valid
      const invitedAt = provider.invitedAt
      if (!invitedAt || (Date.now() - invitedAt.getTime()) > 7 * 24 * 60 * 60 * 1000) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invitation has expired',
        })
      }

      // Hash password
      const hashedPassword = await hashPassword(input.userData.password)

      // Create user
      const user = await ctx.db.user.create({
        data: {
          name: input.userData.name,
          email: input.userData.email,
          phone: input.userData.phone,
          password: hashedPassword,
          role: 'PROVIDER',
        },
      })

      // Update provider with user connection and additional data
      const updatedProvider = await ctx.db.provider.update({
        where: { id: provider.id },
        data: {
          userId: user.id,
          hourlyRate: input.providerData.hourlyRate,
          travelCostPerKm: input.providerData.travelCostPerKm,
          availability: input.providerData.availability || {},
          registeredAt: new Date(),
          isVerified: true,
          inviteToken: null, // Clear the token
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

      return updatedProvider
    }),
})