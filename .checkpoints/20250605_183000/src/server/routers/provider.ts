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

  // Fejlett szolgáltató ingatlanhoz rendelése (egyedi/rendszeres)
  assignToProperty: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      propertyId: z.string(),
      categories: z.array(z.string()).default([]),
      isPrimary: z.boolean().default(false),
      
      // Új hozzárendelési mezők
      assignmentType: z.enum(['ONE_TIME', 'RECURRING', 'PERMANENT']).default('ONE_TIME'),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
      description: z.string().optional(),
      notes: z.string().optional(),
      
      // Egyedi hozzárendelések
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      
      // Rendszeres hozzárendelések
      isRecurring: z.boolean().default(false),
      recurringPattern: z.object({
        type: z.enum(['daily', 'weekly', 'monthly']),
        days: z.array(z.number()).optional(), // 1-7 hétköznapok
        time: z.string().optional(), // "09:00" formátum
        interval: z.number().default(1), // minden x napban/hetben/hónapban
      }).optional(),
      recurringStartDate: z.date().optional(),
      recurringEndDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága szolgáltató hozzárendeléséhez',
        })
      }

      // Ellenőrizzük, hogy már létezik-e a kapcsolat
      const existingAssignment = await ctx.db.propertyProvider.findUnique({
        where: {
          propertyId_providerId: {
            propertyId: input.propertyId,
            providerId: input.providerId,
          },
        },
      })

      if (existingAssignment) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ez a szolgáltató már hozzá van rendelve ehhez az ingatlanhoz',
        })
      }

      // Hozzárendelés létrehozása
      const assignment = await ctx.db.propertyProvider.create({
        data: {
          providerId: input.providerId,
          propertyId: input.propertyId,
          categories: input.categories,
          isPrimary: input.isPrimary,
          
          // Új mezők
          assignmentType: input.assignmentType,
          priority: input.priority,
          description: input.description,
          notes: input.notes,
          assignedBy: ctx.session.user.id,
          
          // Egyedi hozzárendelések
          startDate: input.startDate,
          endDate: input.endDate,
          
          // Rendszeres hozzárendelések
          isRecurring: input.isRecurring,
          recurringPattern: input.recurringPattern,
          recurringStartDate: input.recurringStartDate,
          recurringEndDate: input.recurringEndDate,
          
          isActive: true,
        },
        include: {
          provider: {
            include: {
              user: true,
            },
          },
          property: true,
        },
      })

      // Automatikus hozzáférési szabály létrehozása
      try {
        const accessAutomationService = await import('@/lib/access-automation')
        
        // Determine provider type based on assignment
        let providerType: 'REGULAR' | 'OCCASIONAL' | 'EMERGENCY' = 'OCCASIONAL'
        if (input.assignmentType === 'PERMANENT' || input.isPrimary) {
          providerType = 'REGULAR'
        } else if (input.priority === 'URGENT') {
          providerType = 'EMERGENCY'
        }
        
        // Setup access rules based on assignment type
        await accessAutomationService.accessAutomationService.setupRegularProviderAccess({
          propertyId: input.propertyId,
          providerId: input.providerId,
          providerType,
          timeRestriction: input.assignmentType === 'PERMANENT' ? 'NO_RESTRICTION' : 'BUSINESS_HOURS',
          allowedWeekdays: input.recurringPattern?.days || [1, 2, 3, 4, 5],
          renewalPeriodDays: input.assignmentType === 'PERMANENT' ? 365 : (input.isPrimary ? 180 : 30),
          notes: `Automatikus szabály - ${input.assignmentType} hozzárendelés: ${assignment.provider.businessName}`
        })
        
        console.log(`✅ Automatikus hozzáférési szabály létrehozva: ${assignment.provider.businessName} (${input.assignmentType})`)
      } catch (accessError) {
        console.warn('Hozzáférési szabály létrehozás sikertelen:', accessError)
        // Nem dobunk hibát, csak logoljuk - a hozzárendelés sikeresen megtörtént
      }

      return assignment
    }),

  // Szolgáltató ingatlanról eltávolítása
  removeFromProperty: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      propertyId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága szolgáltató eltávolításához',
        })
      }

      await ctx.db.propertyProvider.delete({
        where: {
          propertyId_providerId: {
            propertyId: input.propertyId,
            providerId: input.providerId,
          },
        },
      })

      return { success: true }
    }),

  // Ingatlan szolgáltatóinak lekérdezése
  getPropertyProviders: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.db.propertyProvider.findMany({
        where: {
          propertyId: input.propertyId,
          isActive: true,
        },
        include: {
          provider: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [
          { isPrimary: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      })

      return assignments
    }),

  // Szolgáltató ingatlanainak lekérdezése (fordított irány)
  getProviderProperties: protectedProcedure
    .input(z.object({
      providerId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.db.propertyProvider.findMany({
        where: {
          providerId: input.providerId,
          isActive: true,
        },
        include: {
          property: {
            include: {
              owner: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { isPrimary: 'desc' },
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      })

      return assignments
    }),

  // Hozzárendelés frissítése
  updateAssignment: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      providerId: z.string(),
      
      // Frissíthető mezők
      categories: z.array(z.string()).optional(),
      isPrimary: z.boolean().optional(),
      assignmentType: z.enum(['ONE_TIME', 'RECURRING', 'PERMANENT']).optional(),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      
      // Egyedi hozzárendelések
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      
      // Rendszeres hozzárendelések
      isRecurring: z.boolean().optional(),
      recurringPattern: z.object({
        type: z.enum(['daily', 'weekly', 'monthly']),
        days: z.array(z.number()).optional(),
        time: z.string().optional(),
        interval: z.number().default(1),
      }).optional(),
      recurringStartDate: z.date().optional(),
      recurringEndDate: z.date().optional(),
      
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága hozzárendelés módosításához',
        })
      }

      const { propertyId, providerId, ...updateData } = input

      // Check if assignment exists
      const existingAssignment = await ctx.db.propertyProvider.findUnique({
        where: {
          propertyId_providerId: {
            propertyId,
            providerId,
          },
        },
      })

      if (!existingAssignment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Hozzárendelés nem található',
        })
      }

      // Update assignment
      const updatedAssignment = await ctx.db.propertyProvider.update({
        where: {
          propertyId_providerId: {
            propertyId,
            providerId,
          },
        },
        data: updateData,
        include: {
          provider: {
            include: {
              user: true,
            },
          },
          property: true,
        },
      })

      return updatedAssignment
    }),

  // Összes hozzárendelés lekérdezése (admin dashboard-hoz)
  getAllAssignments: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      assignmentType: z.enum(['ONE_TIME', 'RECURRING', 'PERMANENT']).optional(),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága az összes hozzárendelés megtekintéséhez',
        })
      }

      const { page, limit, assignmentType, priority, isActive } = input
      const skip = (page - 1) * limit

      const where: any = {}
      if (assignmentType) where.assignmentType = assignmentType
      if (priority) where.priority = priority
      if (isActive !== undefined) where.isActive = isActive

      const [assignments, total] = await Promise.all([
        ctx.db.propertyProvider.findMany({
          where,
          skip,
          take: limit,
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            property: {
              select: {
                id: true,
                street: true,
                city: true,
                type: true,
              },
            },
          },
          orderBy: [
            { priority: 'desc' },
            { isPrimary: 'desc' },
            { updatedAt: 'desc' },
          ],
        }),
        ctx.db.propertyProvider.count({ where }),
      ])

      return {
        assignments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  // Szolgáltató ingatlanhoz rendelése (fordított irány - szolgáltató oldalról)
  assignPropertyToProvider: protectedProcedure
    .input(z.object({
      providerId: z.string(),
      propertyId: z.string(),
      categories: z.array(z.string()).default([]),
      isPrimary: z.boolean().default(false),
      
      // Hozzárendelési mezők
      assignmentType: z.enum(['ONE_TIME', 'RECURRING', 'PERMANENT']).default('ONE_TIME'),
      priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
      description: z.string().optional(),
      notes: z.string().optional(),
      
      // Egyedi hozzárendelések
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      
      // Rendszeres hozzárendelések
      isRecurring: z.boolean().default(false),
      recurringPattern: z.object({
        type: z.enum(['daily', 'weekly', 'monthly']),
        days: z.array(z.number()).optional(),
        time: z.string().optional(),
        interval: z.number().default(1),
      }).optional(),
      recurringStartDate: z.date().optional(),
      recurringEndDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ez ugyanaz a logika, mint az assignToProperty, csak más oldalról indítva
      // Ugyanazt a kódot futtatjuk, csak a bemeneti paraméterek sorrendje más
      const { providerId, propertyId, ...restInput } = input
      
      // Call the existing assignToProperty logic with proper parameter mapping
      const assignToPropertyInput = {
        providerId,
        propertyId,
        ...restInput,
      }
      
      // Manually invoke the same logic as assignToProperty
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága szolgáltató hozzárendeléséhez',
        })
      }

      // Check for existing assignment
      const existingAssignment = await ctx.db.propertyProvider.findUnique({
        where: {
          propertyId_providerId: {
            propertyId,
            providerId,
          },
        },
      })

      if (existingAssignment) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ez a szolgáltató már hozzá van rendelve ehhez az ingatlanhoz',
        })
      }

      // Create assignment
      const assignment = await ctx.db.propertyProvider.create({
        data: {
          providerId,
          propertyId,
          categories: input.categories,
          isPrimary: input.isPrimary,
          assignmentType: input.assignmentType,
          priority: input.priority,
          description: input.description,
          notes: input.notes,
          assignedBy: ctx.session.user.id,
          startDate: input.startDate,
          endDate: input.endDate,
          isRecurring: input.isRecurring,
          recurringPattern: input.recurringPattern,
          recurringStartDate: input.recurringStartDate,
          recurringEndDate: input.recurringEndDate,
          isActive: true,
        },
        include: {
          provider: {
            include: {
              user: true,
            },
          },
          property: true,
        },
      })

      return assignment
    }),
})