import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const coTenantRouter = createTRPCRouter({
  listByTenant: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Check if user has access to this tenant
      const tenant = await ctx.db.tenant.findUnique({
        where: { id: input },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'TENANT' && tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      const coTenants = await ctx.db.coTenant.findMany({
        where: { tenantId: input },
        orderBy: { createdAt: 'desc' },
      })

      return coTenants
    }),

  create: protectedProcedure
    .input(z.object({
      tenantId: z.string(),
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      phone: z.string().optional(),
      idNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to this tenant
      const tenant = await ctx.db.tenant.findUnique({
        where: { id: input.tenantId },
      })

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        })
      }

      // Check permissions - tenants can add co-tenants to their own profile
      if (ctx.session.user.role === 'TENANT' && tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only add co-tenants to your own profile',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const coTenant = await ctx.db.coTenant.create({
        data: input,
      })

      return coTenant
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      phone: z.string().optional(),
      idNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Get co-tenant to check permissions
      const coTenant = await ctx.db.coTenant.findUnique({
        where: { id },
        include: { tenant: true },
      })

      if (!coTenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Co-tenant not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'TENANT' && coTenant.tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update co-tenants on your own profile',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const updated = await ctx.db.coTenant.update({
        where: { id },
        data,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Get co-tenant to check permissions
      const coTenant = await ctx.db.coTenant.findUnique({
        where: { id: input },
        include: { tenant: true },
      })

      if (!coTenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Co-tenant not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'TENANT' && coTenant.tenant.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete co-tenants from your own profile',
        })
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'TENANT'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      await ctx.db.coTenant.delete({
        where: { id: input },
      })

      return { success: true }
    }),
})