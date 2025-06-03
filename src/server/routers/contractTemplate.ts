import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { ContractTemplateType } from '@prisma/client'

export const contractTemplateRouter = createTRPCRouter({
  // List all templates
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      type: z.nativeEnum(ContractTemplateType).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Only admins can manage templates
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága a sablonok megtekintéséhez',
        })
      }

      const where: any = {}
      
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ]
      }
      
      if (input.type) {
        where.type = input.type
      }
      
      if (input.isActive !== undefined) {
        where.isActive = input.isActive
      }

      const [templates, total] = await Promise.all([
        ctx.db.contractTemplate.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.contractTemplate.count({ where }),
      ])

      return {
        templates,
        total,
        totalPages: Math.ceil(total / input.limit),
      }
    }),

  // Get single template
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.contractTemplate.findUnique({
        where: { id: input },
      })

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sablon nem található',
        })
      }

      return template
    }),

  // Create new template
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'A név megadása kötelező'),
      type: z.nativeEnum(ContractTemplateType),
      description: z.string().optional(),
      content: z.string().min(1, 'A sablon tartalma kötelező'),
      variables: z.array(z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['text', 'number', 'date', 'boolean']),
        required: z.boolean().default(true),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can create templates
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága sablon létrehozásához',
        })
      }

      const template = await ctx.db.contractTemplate.create({
        data: {
          ...input,
          isSystem: false, // User created templates are not system templates
        },
      })

      return template
    }),

  // Update template
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, 'A név megadása kötelező'),
      type: z.nativeEnum(ContractTemplateType),
      description: z.string().optional(),
      content: z.string().min(1, 'A sablon tartalma kötelező'),
      variables: z.array(z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['text', 'number', 'date', 'boolean']),
        required: z.boolean().default(true),
      })).default([]),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only admins can update templates
      if (!['ADMIN', 'EDITOR_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága sablon módosításához',
        })
      }

      const { id, ...data } = input

      const template = await ctx.db.contractTemplate.update({
        where: { id },
        data,
      })

      return template
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete templates
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nincs jogosultsága sablon törléséhez',
        })
      }

      // Check if template is system template
      const template = await ctx.db.contractTemplate.findUnique({
        where: { id: input },
        select: { isSystem: true },
      })

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sablon nem található',
        })
      }

      if (template.isSystem) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Rendszer sablonok nem törölhetők',
        })
      }

      await ctx.db.contractTemplate.delete({
        where: { id: input },
      })

      return { success: true }
    }),

  // Get all active templates for dropdown
  listActive: protectedProcedure
    .query(async ({ ctx }) => {
      const templates = await ctx.db.contractTemplate.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' },
        ],
      })

      return templates
    }),

  // Preview template with sample data
  preview: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      data: z.record(z.any()),
    }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.contractTemplate.findUnique({
        where: { id: input.templateId },
      })

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sablon nem található',
        })
      }

      // Replace variables in template content
      let content = template.content
      const variables = template.variables as Array<{key: string, label: string, type: string}>

      variables.forEach(variable => {
        const value = input.data[variable.key] || `[${variable.label}]`
        const regex = new RegExp(`{{${variable.key}}}`, 'g')
        content = content.replace(regex, String(value))
      })

      return {
        content,
        template,
      }
    }),
})