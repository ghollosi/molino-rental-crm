import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const OfferItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  total: z.number().positive(),
})

export const offerRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
      propertyId: z.string().optional(),
      issueId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, propertyId, issueId } = input
      const skip = (page - 1) * limit

      let where: any = {}

      // Role-based filtering
      if (ctx.session.user.role === 'OWNER') {
        const owner = await ctx.db.owner.findUnique({
          where: { userId: ctx.session.user.id },
          include: { properties: { select: { id: true } } },
        })
        if (owner) {
          where.propertyId = { in: owner.properties.map(p => p.id) }
        } else {
          return { offers: [], pagination: { page, limit, total: 0, totalPages: 0 } }
        }
      }

      // Add search filters
      if (search) {
        where.OR = [
          { offerNumber: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      if (status) where.status = status
      if (propertyId) where.propertyId = propertyId
      if (issueId) where.issueId = issueId

      const [offers, total] = await Promise.all([
        ctx.db.offer.findMany({
          where,
          skip,
          take: limit,
          include: {
            property: {
              select: {
                id: true,
                street: true,
                city: true,
                owner: { include: { user: true } },
              },
            },
            issue: {
              select: {
                id: true,
                title: true,
                ticketNumber: true,
                category: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.offer.count({ where }),
      ])

      return {
        offers,
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
      const offer = await ctx.db.offer.findUnique({
        where: { id: input },
        include: {
          property: {
            include: {
              owner: { include: { user: true } },
            },
          },
          issue: {
            include: {
              reportedBy: {
                select: {
                  firstName: true,
                lastName: true,
                  email: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      if (!offer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Offer not found',
        })
      }

      // Check permissions
      const hasAccess = await checkOfferAccess(ctx, offer)
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return offer
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      issueId: z.string().optional(),
      items: z.array(OfferItemSchema).min(1, 'At least one item is required'),
      laborCost: z.number().min(0).optional(),
      materialCost: z.number().min(0).optional(),
      totalAmount: z.number().positive(),
      currency: z.string().default('EUR'),
      validUntil: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      // Generate unique offer number
      const offerNumber = `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      const offer = await ctx.db.offer.create({
        data: {
          ...input,
          offerNumber,
          createdById: ctx.session.user.id,
        },
        include: {
          property: {
            include: {
              owner: { include: { user: true } },
            },
          },
          issue: true,
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      return offer
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      items: z.array(OfferItemSchema).optional(),
      laborCost: z.number().min(0).optional(),
      materialCost: z.number().min(0).optional(),
      totalAmount: z.number().positive().optional(),
      validUntil: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Check permissions and if offer is editable
      const existingOffer = await ctx.db.offer.findUnique({
        where: { id },
        select: { status: true, createdById: true },
      })

      if (!existingOffer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Offer not found',
        })
      }

      if (existingOffer.status !== 'DRAFT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft offers can be edited',
        })
      }

      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const offer = await ctx.db.offer.update({
        where: { id },
        data,
        include: {
          property: true,
          issue: true,
          createdBy: true,
        },
      })

      return offer
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const offer = await ctx.db.offer.update({
        where: { id: input.id },
        data: { status: input.status },
        include: {
          property: true,
          issue: true,
        },
      })

      return offer
    }),

  send: protectedProcedure
    .input(z.string()) // offer id
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const offer = await ctx.db.offer.findUnique({
        where: { id: input },
        include: {
          property: { include: { owner: { include: { user: true } } } },
        },
      })

      if (!offer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Offer not found',
        })
      }

      if (offer.status !== 'DRAFT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft offers can be sent',
        })
      }

      const updatedOffer = await ctx.db.offer.update({
        where: { id: input },
        data: { status: 'SENT' },
      })

      // TODO: Send email to property owner
      // await sendOfferEmail(offer)

      return updatedOffer
    }),

  accept: protectedProcedure
    .input(z.string()) // offer id
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.db.offer.findUnique({
        where: { id: input },
        include: {
          property: { include: { owner: true } },
        },
      })

      if (!offer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Offer not found',
        })
      }

      // Check if user is the property owner or has admin rights
      if (ctx.session.user.role === 'OWNER') {
        const owner = await ctx.db.owner.findUnique({
          where: { userId: ctx.session.user.id },
        })
        if (!owner || offer.property.ownerId !== owner.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the property owner can accept offers',
          })
        }
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      if (offer.status !== 'SENT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only sent offers can be accepted',
        })
      }

      const updatedOffer = await ctx.db.offer.update({
        where: { id: input },
        data: { status: 'ACCEPTED' },
      })

      return updatedOffer
    }),

  reject: protectedProcedure
    .input(z.string()) // offer id
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.db.offer.findUnique({
        where: { id: input },
        include: {
          property: { include: { owner: true } },
        },
      })

      if (!offer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Offer not found',
        })
      }

      // Check if user is the property owner or has admin rights
      if (ctx.session.user.role === 'OWNER') {
        const owner = await ctx.db.owner.findUnique({
          where: { userId: ctx.session.user.id },
        })
        if (!owner || offer.property.ownerId !== owner.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the property owner can reject offers',
          })
        }
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      if (offer.status !== 'SENT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only sent offers can be rejected',
        })
      }

      const updatedOffer = await ctx.db.offer.update({
        where: { id: input },
        data: { status: 'REJECTED' },
      })

      return updatedOffer
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete offers
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete offers',
        })
      }

      await ctx.db.offer.delete({
        where: { id: input },
      })

      return { success: true }
    }),

})

// Helper method to check offer access
async function checkOfferAccess(ctx: any, offer: any) {
    const userRole = ctx.session.user.role
    const userId = ctx.session.user.id

    if (['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(userRole)) {
      return true
    }

    if (userRole === 'OWNER') {
      const owner = await ctx.db.owner.findUnique({
        where: { userId },
      })
      return owner && offer.property.ownerId === owner.id
    }

    return false
}