import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

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
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
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
                firstName: true,
              lastName: true,
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
              firstName: true,
              lastName: true,
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
                  firstName: true,
              lastName: true,
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
              firstName: true,
              lastName: true,
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
      // Basic company info
      businessName: z.string().min(1, 'Cégnév megadása kötelező'),
      representativeName: z.string().optional(),
      salutation: z.string().optional(),
      
      // Contact details
      email: z.string().email('Érvényes email cím szükséges').optional(),
      website: z.string().url('Érvényes weboldal cím szükséges').optional(),
      
      // Business details
      taxNumber: z.string().optional(),
      bankAccount: z.string().optional(),
      
      // Address
      street: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      
      // Photos
      companyLogo: z.string().optional(),
      profilePhoto: z.string().optional(),
      
      // Service details
      specialty: z.array(z.string()).min(1, 'Legalább egy szakterület megadása kötelező'),
      hourlyRate: z.number().positive('Az óradíj pozitív szám kell legyen').optional(),
      travelFee: z.number().min(0, 'A kiszállási díj nem lehet negatív').optional(),
      currency: z.string().default('EUR'),
      availability: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága szolgáltató létrehozásához',
        })
      }

      // Create a new user for the provider (simplified approach - no user account needed)
      // We'll use a placeholder user with PROVIDER role
      const user = await ctx.db.user.create({
        data: {
          email: input.email || `provider-${Date.now()}@temp.local`,
          password: 'temp-password', // This will be updated when/if they set up login
          firstName: input.representativeName || 'Szolgáltató',
          lastName: '',
          role: 'PROVIDER',
          phone: '', // We'll get this from the provider form if needed
          isActive: true,
        },
      })

      const provider = await ctx.db.provider.create({
        data: {
          ...input,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      })

      return provider
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      // Basic company info
      businessName: z.string().min(1, 'Cégnév megadása kötelező'),
      representativeName: z.string().optional(),
      salutation: z.string().optional(),
      
      // Contact details
      email: z.string().email('Érvényes email cím szükséges').optional(),
      website: z.string().url('Érvényes weboldal cím szükséges').optional(),
      
      // Business details
      taxNumber: z.string().optional(),
      bankAccount: z.string().optional(),
      
      // Address
      street: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      
      // Photos
      companyLogo: z.string().optional(),
      profilePhoto: z.string().optional(),
      
      // Service details
      specialty: z.array(z.string()).min(1, 'Legalább egy szakterület megadása kötelező'),
      hourlyRate: z.number().positive('Az óradíj pozitív szám kell legyen').optional(),
      travelFee: z.number().min(0, 'A kiszállási díj nem lehet negatív').optional(),
      currency: z.string().default('EUR'),
      availability: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Check permissions - providers can update their own profile
      const provider = await ctx.db.provider.findUnique({
        where: { id },
      })

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Szolgáltató nem található',
        })
      }

      if (ctx.session.user.role === 'PROVIDER' && provider.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Csak a saját profilt módosíthatja',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER', 'PROVIDER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága',
        })
      }

      // Update user data if email or representative name changed
      if (updateData.email || updateData.representativeName) {
        await ctx.db.user.update({
          where: { id: provider.userId },
          data: {
            ...(updateData.email && { email: updateData.email }),
            ...(updateData.representativeName && { firstName: updateData.representativeName }),
          },
        })
      }

      // Update provider data
      const updatedProvider = await ctx.db.provider.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
              firstName: true,
              lastName: true,
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

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete providers
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete providers',
        })
      }

      // Check if provider exists
      const provider = await ctx.db.provider.findUnique({
        where: { id: input },
        include: {
          user: true,
        },
      })

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider not found',
        })
      }

      // Delete provider and associated user in transaction
      await ctx.db.$transaction(async (tx) => {
        // Delete provider first
        await tx.provider.delete({
          where: { id: input },
        })

        // Delete associated user if they exist
        if (provider.user) {
          await tx.user.delete({
            where: { id: provider.userId },
          })
        }
      })

      return { success: true }
    }),
})