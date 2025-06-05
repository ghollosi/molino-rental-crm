import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const companyRouter = createTRPCRouter({
  get: protectedProcedure
    .query(async ({ ctx }) => {
      // Only admins can view company settings
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const company = await ctx.db.company.findFirst()
      
      if (!company) {
        // Create default company settings if none exist
        const newCompany = await ctx.db.company.create({
          data: {
            name: 'Molino RENTAL',
            email: 'info@molino.com',
            phone: '+36 1 234 5678',
            street: 'Példa utca 1.',
            city: 'Budapest',
            postalCode: '1133',
            country: 'Magyarország',
            taxNumber: '12345678-1-42',
            bankAccount: '12345678-12345678-12345678',
            settings: {
              currency: 'HUF',
              language: 'HU',
              timezone: 'Europe/Budapest',
            },
          },
        })
        return newCompany
      }

      return company
    }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      taxNumber: z.string().optional(),
      bankAccount: z.string().optional(),
      website: z.string().url().optional().nullable(),
      logo: z.string().optional().nullable(),
      settings: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can update company settings
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const company = await ctx.db.company.findFirst()
      
      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company settings not found',
        })
      }

      const updated = await ctx.db.company.update({
        where: { id: company.id },
        data: input,
      })

      return updated
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      currency: z.string().optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      emailNotifications: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can update settings
      if (!['ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can update settings',
        })
      }

      const company = await ctx.db.company.findFirst()
      
      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company settings not found',
        })
      }

      const currentSettings = company.settings as Record<string, unknown> || {}
      const newSettings = { ...currentSettings, ...input }

      const updated = await ctx.db.company.update({
        where: { id: company.id },
        data: {
          settings: newSettings,
        },
      })

      return updated
    }),
})