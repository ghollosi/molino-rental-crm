import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { ContractStatus, ContractTemplateCategory } from '@prisma/client';
import { generateContract, renderTemplate } from '@/lib/contract-templates';

export const contractsRouter = createTRPCRouter({
  // Get expiring contracts
  getExpiringContracts: protectedProcedure
    .input(z.object({
      days: z.number().default(60)
    }))
    .query(async ({ ctx, input }) => {
      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + input.days)
      
      const contracts = await ctx.db.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: today,
            lte: futureDate
          }
        },
        include: {
          property: true,
          tenant: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          endDate: 'asc'
        }
      })
      
      return contracts
    }),
    
  // Get all contracts
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.contract.findMany({
      include: {
        property: true,
        tenant: true,
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  // Get contract by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contract.findUnique({
        where: { id: input.id },
        include: {
          property: {
            include: {
              owner: true,
            },
          },
          tenant: true,
          template: true,
        },
      });
    }),

  // Create new contract
  create: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      tenantId: z.string(),
      templateId: z.string().optional(),
      rentAmount: z.number(),
      deposit: z.number(),
      startDate: z.date(),
      endDate: z.date(),
      customTerms: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      let content = '';
      
      if (input.templateId) {
        const template = await ctx.db.contractTemplate.findUnique({
          where: { id: input.templateId },
        });
        
        if (template) {
          const contractData = await generateContract(input.propertyId, input.tenantId, {
            rentAmount: input.rentAmount,
            deposit: input.deposit,
            startDate: input.startDate,
            endDate: input.endDate,
            customTerms: input.customTerms,
          }, input.templateId);
          content = renderTemplate(template.content, contractData);
        }
      }

      return ctx.db.contract.create({
        data: {
          propertyId: input.propertyId,
          tenantId: input.tenantId,
          templateId: input.templateId,
          content,
          rentAmount: input.rentAmount,
          deposit: input.deposit,
          startDate: input.startDate,
          endDate: input.endDate,
          status: ContractStatus.DRAFT,
          customTerms: input.customTerms,
        },
        include: {
          property: true,
          tenant: true,
          template: true,
        },
      });
    }),

  // Update contract
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      rentAmount: z.number().optional(),
      deposit: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      status: z.nativeEnum(ContractStatus).optional(),
      customTerms: z.string().optional(),
      landlordSignature: z.string().optional(),
      tenantSignature: z.string().optional(),
      landlordSignedAt: z.date().optional(),
      tenantSignedAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      return ctx.db.contract.update({
        where: { id },
        data: updateData,
        include: {
          property: true,
          tenant: true,
          template: true,
        },
      });
    }),

  // Delete contract
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contract.delete({
        where: { id: input.id },
      });
    }),

  // Get all contract templates
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.contractTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }),

  // Get template by ID
  getTemplateById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.contractTemplate.findUnique({
        where: { id: input.id },
      });
    }),

  // Create contract template
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      content: z.string(),
      variables: z.record(z.any()),
      category: z.nativeEnum(ContractTemplateCategory),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contractTemplate.create({
        data: {
          ...input,
          title: input.name, // Use name as title
        },
      });
    }),

  // Update contract template
  updateTemplate: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      variables: z.record(z.any()).optional(),
      category: z.nativeEnum(ContractTemplateCategory).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      return ctx.db.contractTemplate.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete contract template
  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contractTemplate.delete({
        where: { id: input.id },
      });
    }),

  // Generate contract from template
  generateFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      propertyId: z.string(),
      tenantId: z.string(),
      contractTerms: z.object({
        rentAmount: z.number(),
        deposit: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        customTerms: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.db.contractTemplate.findUnique({
        where: { id: input.templateId },
      });

      if (!template) {
        throw new Error('Template not found');
      }

      const contractData = await generateContract(
        input.propertyId,
        input.tenantId,
        input.contractTerms,
        input.templateId
      );

      const content = renderTemplate(template.content, contractData);

      return {
        template,
        contractData,
        renderedContent: content,
      };
    }),
});