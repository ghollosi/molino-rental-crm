import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import bcrypt from 'bcryptjs'

export const tenantRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { page, limit, search, isActive } = input
      const skip = (page - 1) * limit

      const where: any = {}

      if (search) {
        where.user = {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      }

      if (isActive !== undefined) {
        where.isActive = isActive
      }

      const [tenants, total] = await Promise.all([
        ctx.db.tenant.findMany({
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
            coTenants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            },
            mainTenant: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                }
              }
            },
            properties: {
              select: {
                id: true,
                street: true,
                city: true,
                type: true,
                status: true,
              },
            },
            _count: {
              select: {
                contracts: true,
                coTenants: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.tenant.count({ where }),
      ])

      return {
        tenants,
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
      const tenant = await ctx.db.tenant.findUnique({
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
          coTenants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                }
              }
            }
          },
          mainTenant: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          },
          properties: {
            include: {
              owner: { include: { user: true } },
            },
          },
          contracts: {
            include: {
              property: true,
            },
            orderBy: { startDate: 'desc' },
          },
        },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      // Check access permissions
      if (ctx.session.user.role === 'TENANT' && tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return tenant
    }),

  // NEW: Enhanced create with co-tenants support
  create: protectedProcedure
    .input(z.object({
      // Main tenant data
      firstName: z.string().min(1, 'Vezetéknév kötelező'),
      lastName: z.string().min(1, 'Keresztnév kötelező'),
      email: z.string().email('Érvényes email cím szükséges'),
      password: z.string().min(6, 'A jelszó legalább 6 karakter hosszú legyen'),
      phone: z.string().optional(),
      
      // Address & contact
      address: z.string().optional(),
      emergencyName: z.string().optional(),
      emergencyPhone: z.string().optional(),
      
      // Documents
      documents: z.array(z.string()).default([]),
      notes: z.string().optional(),
      
      // Bérlési adatok
      propertyId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      
      // Co-tenants
      coTenants: z.array(z.object({
        firstName: z.string().min(1, 'Vezetéknév kötelező'),
        lastName: z.string().min(1, 'Keresztnév kötelező'),
        email: z.string().email('Érvényes email cím szükséges'),
        phone: z.string().optional(),
        documents: z.array(z.string()).default([]),
      })).default([])
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { firstName, lastName, email, password, coTenants, propertyId, startDate, endDate, ...tenantData } = input

      // Check if email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ez az email cím már használatban van',
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create main tenant with user in transaction
      const result = await ctx.db.$transaction(async (tx) => {
        // Create main user
        const mainUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            phone: tenantData.phone,
            password: hashedPassword,
            role: 'TENANT',
          },
        })

        // Create main tenant
        const mainTenant = await tx.tenant.create({
          data: {
            userId: mainUser.id,
            emergencyName: tenantData.emergencyName,
            emergencyPhone: tenantData.emergencyPhone,
            documents: tenantData.documents,
            notes: tenantData.notes,
            isPrimary: true,
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

        // Create co-tenants if any
        const createdCoTenants = []
        for (const coTenantData of coTenants) {
          // Check if co-tenant email exists
          const existingCoTenantUser = await tx.user.findUnique({
            where: { email: coTenantData.email },
          })

          if (existingCoTenantUser) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Az email cím ${coTenantData.email} már használatban van`,
            })
          }

          // Create co-tenant user (with temporary password)
          const coTenantUser = await tx.user.create({
            data: {
              firstName: coTenantData.firstName,
              lastName: coTenantData.lastName,
              email: coTenantData.email,
              phone: coTenantData.phone,
              password: hashedPassword, // Same as main tenant for now
              role: 'TENANT',
            },
          })

          // Create co-tenant
          const coTenant = await tx.tenant.create({
            data: {
              userId: coTenantUser.id,
              mainTenantId: mainTenant.id,
              isPrimary: false,
              isActive: true,
              documents: coTenantData.documents || [],
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

          createdCoTenants.push(coTenant)
        }

        // Ha van ingatlan és bérlési időszak, hozzunk létre szerződést
        if (propertyId && startDate && endDate) {
          // Ellenőrizzük, hogy az ingatlan elérhető-e
          const property = await tx.property.findUnique({
            where: { id: propertyId },
          })

          if (!property) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Az ingatlan nem található',
            })
          }

          if (property.status !== 'AVAILABLE') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Az ingatlan nem elérhető bérlésre',
            })
          }

          // Szerződés létrehozása
          await tx.contract.create({
            data: {
              tenantId: mainTenant.id,
              propertyId,
              startDate: new Date(startDate),
              endDate: new Date(endDate),
              rentAmount: property.rentAmount || 0,
              deposit: property.rentAmount ? Number(property.rentAmount) * 2 : 0, // 2 havi kauciója
              paymentDay: 1, // Alapértelmezett fizetési nap
            },
          })

          // Ingatlan státusz frissítése RENTED-re
          await tx.property.update({
            where: { id: propertyId },
            data: { status: 'RENTED' },
          })

          // Bérlő hozzárendelése az ingatlanhoz
          await tx.property.update({
            where: { id: propertyId },
            data: { currentTenantId: mainTenant.id },
          })
        }

        return {
          ...mainTenant,
          coTenants: createdCoTenants,
        }
      })

      return result
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      userId: z.string(),
      userData: z.object({
        firstName: z.string().min(1, 'Vezetéknév kötelező'),
        lastName: z.string().min(1, 'Keresztnév kötelező'),
        email: z.string().email('Érvényes email cím szükséges'),
        phone: z.string().optional(),
      }),
      tenantData: z.object({
        emergencyName: z.string().optional(),
        emergencyPhone: z.string().optional(),
        profilePhoto: z.string().optional(),
        documents: z.array(z.string()).optional(),
        notes: z.string().optional(),
        isActive: z.boolean(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.role === 'TENANT' && input.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { userData, tenantData } = input

      // Update user and tenant in transaction
      const result = await ctx.db.$transaction(async (tx) => {
        // Update user data
        const updatedUser = await tx.user.update({
          where: { id: input.userId },
          data: userData,
        })

        // Update tenant data
        const updatedTenant = await tx.tenant.update({
          where: { id: input.id },
          data: tenantData,
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
            coTenants: {
              include: {
                user: true,
              },
            },
          },
        })

        return updatedTenant
      })

      return result
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const tenant = await ctx.db.tenant.findUnique({
        where: { id: input },
        include: {
          contracts: true,
          coTenants: true,
        },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      // Check if tenant has active contracts
      const activeContracts = tenant.contracts.filter(
        contract => new Date(contract.endDate) > new Date()
      )

      if (activeContracts.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete tenant with active contracts',
        })
      }

      // Delete tenant and co-tenants in transaction
      await ctx.db.$transaction(async (tx) => {
        // Delete co-tenants first
        for (const coTenant of tenant.coTenants) {
          await tx.tenant.delete({
            where: { id: coTenant.id },
          })
          // Optionally delete the user too
          await tx.user.delete({
            where: { id: coTenant.userId },
          })
        }

        // Delete main tenant
        await tx.tenant.delete({
          where: { id: input },
        })

        // Optionally delete the main user too
        await tx.user.delete({
          where: { id: tenant.userId },
        })
      })

      return { success: true }
    }),

  // Add co-tenant to existing tenant
  addCoTenant: protectedProcedure
    .input(z.object({
      mainTenantId: z.string(),
      firstName: z.string().min(1, 'Vezetéknév kötelező'),
      lastName: z.string().min(1, 'Keresztnév kötelező'),
      email: z.string().email('Érvényes email cím szükséges'),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const { mainTenantId, ...coTenantData } = input

      // Check if main tenant exists
      const mainTenant = await ctx.db.tenant.findUnique({
        where: { id: mainTenantId },
      })

      if (!mainTenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Main tenant not found',
        })
      }

      // Check if email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: coTenantData.email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ez az email cím már használatban van',
        })
      }

      // Create co-tenant in transaction
      const result = await ctx.db.$transaction(async (tx) => {
        // Create user for co-tenant
        const coTenantUser = await tx.user.create({
          data: {
            ...coTenantData,
            password: await bcrypt.hash('temporary123', 12), // Temporary password
            role: 'TENANT',
          },
        })

        // Create co-tenant
        const coTenant = await tx.tenant.create({
          data: {
            userId: coTenantUser.id,
            mainTenantId,
            isPrimary: false,
            isActive: true,
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

        return coTenant
      })

      return result
    }),

  // Remove co-tenant
  removeCoTenant: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const coTenant = await ctx.db.tenant.findUnique({
        where: { id: input },
      })

      if (!coTenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Co-tenant not found',
        })
      }

      if (coTenant.isPrimary) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove primary tenant',
        })
      }

      // Delete co-tenant and user in transaction
      await ctx.db.$transaction(async (tx) => {
        await tx.tenant.delete({
          where: { id: input },
        })

        await tx.user.delete({
          where: { id: coTenant.userId },
        })
      })

      return { success: true }
    }),
})