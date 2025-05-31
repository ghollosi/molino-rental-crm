import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { sendEmail, emailTemplates, sendIssueNotification } from '@/lib/email'
import { WorkflowEngine } from '@/lib/workflow'

export const issueRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      category: z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER']).optional(),
      propertyId: z.string().optional(),
      assignedToId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, priority, category, propertyId, assignedToId } = input
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
          return { issues: [], pagination: { page, limit, total: 0, totalPages: 0 } }
        }
      } else if (ctx.session.user.role === 'TENANT') {
        const tenant = await ctx.db.tenant.findUnique({
          where: { userId: ctx.session.user.id },
          include: { properties: { select: { id: true } } },
        })
        if (tenant) {
          where.OR = [
            { propertyId: { in: tenant.properties.map(p => p.id) } },
            { reportedById: ctx.session.user.id },
          ]
        } else {
          where.reportedById = ctx.session.user.id
        }
      } else if (ctx.session.user.role === 'PROVIDER') {
        const provider = await ctx.db.provider.findUnique({
          where: { userId: ctx.session.user.id },
        })
        if (provider) {
          where.assignedToId = provider.id
        } else {
          return { issues: [], pagination: { page, limit, total: 0, totalPages: 0 } }
        }
      }

      // Add search filters
      if (search) {
        where.OR = [
          ...(where.OR || []),
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { ticketNumber: { contains: search, mode: 'insensitive' as const } },
        ]
      }

      if (status) where.status = status
      if (priority) where.priority = priority
      if (category) where.category = category
      if (propertyId) where.propertyId = propertyId
      if (assignedToId) where.assignedToId = assignedToId

      const [issues, total] = await Promise.all([
        ctx.db.issue.findMany({
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
            reportedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignedTo: {
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
            },
            managedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                offers: true,
                timeline: true,
              },
            },
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        ctx.db.issue.count({ where }),
      ])

      return {
        issues,
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
      const issue = await ctx.db.issue.findUnique({
        where: { id: input },
        include: {
          property: {
            include: {
              owner: { include: { user: true } },
              currentTenant: { include: { user: true } },
            },
          },
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          assignedTo: {
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
          },
          managedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          timeline: {
            include: {
              changedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { timestamp: 'desc' },
          },
          offers: {
            include: {
              createdBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!issue) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Issue not found',
        })
      }

      // Check permissions
      const hasAccess = await checkIssueAccess(ctx, issue)
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      return issue
    }),

  create: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required'),
      category: z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER']),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
      photos: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate unique ticket number
      const ticketNumber = `ISS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      const issue = await ctx.db.issue.create({
        data: {
          ...input,
          ticketNumber,
          reportedById: ctx.session.user.id,
        },
        include: {
          property: {
            include: {
              owner: { include: { user: true } },
            },
          },
          reportedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      // Create initial timeline entry
      await ctx.db.issueTimeline.create({
        data: {
          issueId: issue.id,
          status: 'OPEN',
          changedById: ctx.session.user.id,
          notes: 'Issue created',
        },
      })

      // Send email notification to property owner
      try {
        const emailContent = emailTemplates.issueCreated(issue, issue.property, issue.property.owner)
        await sendEmail({
          to: issue.property.owner.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      } catch (error) {
        console.error('Failed to send issue created email:', error)
        // Don't throw error to prevent issue creation failure
      }

      // Trigger workflow automation
      try {
        await WorkflowEngine.onIssueCreated(issue.id)
      } catch (error) {
        console.error('Failed to execute workflow:', error)
        // Don't throw error to prevent issue creation failure
      }

      return issue
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      category: z.enum(['PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER']),
      status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']).optional(),
      photos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const issue = await ctx.db.issue.findUnique({
        where: { id },
        include: { property: { include: { owner: true } } },
      })

      if (!issue) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Issue not found',
        })
      }

      // Check permissions
      if (ctx.session.user.role === 'OWNER') {
        if (issue.property.owner.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update issues for your own properties',
          })
        }
      } else if (ctx.session.user.role === 'TENANT') {
        if (issue.reportedById !== ctx.session.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update your own reported issues',
          })
        }
      } else if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        })
      }

      const updatedIssue = await ctx.db.issue.update({
        where: { id },
        data,
        include: {
          property: {
            include: { owner: { include: { user: true } } },
          },
          reportedBy: true,
          assignedTo: {
            include: { user: true },
          },
          managedBy: true,
        },
      })

      // Trigger workflow automation if photos were added
      if (data.photos && data.photos.length > 0) {
        try {
          await WorkflowEngine.onPhotoAdded(id, data.photos)
        } catch (error) {
          console.error('Failed to execute photo workflow:', error)
        }
      }

      return updatedIssue
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const issue = await ctx.db.issue.findUnique({
        where: { id: input.id },
      })

      if (!issue) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Issue not found',
        })
      }

      // Update issue status
      const updatedIssue = await ctx.db.issue.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.status === 'COMPLETED' && { completedDate: new Date() }),
        },
      })

      // Create timeline entry
      await ctx.db.issueTimeline.create({
        data: {
          issueId: input.id,
          status: input.status,
          changedById: ctx.session.user.id,
          notes: input.notes,
        },
      })

      // Send email notification on status change
      try {
        const fullIssue = await ctx.db.issue.findUnique({
          where: { id: input.id },
          include: {
            property: {
              include: { owner: { include: { user: true } } }
            },
            reportedBy: true
          }
        })

        const changedBy = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id }
        })

        if (fullIssue && changedBy) {
          const emailContent = emailTemplates.issueStatusChanged(
            fullIssue, 
            fullIssue.property, 
            input.status,
            changedBy
          )
          
          // Send to property owner
          await sendEmail({
            to: fullIssue.property.owner.user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          })

          // Also send to reporter if different from owner
          if (fullIssue.reportedBy.email !== fullIssue.property.owner.user.email) {
            await sendEmail({
              to: fullIssue.reportedBy.email,
              subject: emailContent.subject,
              html: emailContent.html,
            })
          }
        }
      } catch (error) {
        console.error('Failed to send status change email:', error)
      }

      return updatedIssue
    }),

  assign: protectedProcedure
    .input(z.object({
      id: z.string(),
      providerId: z.string(),
      scheduledDate: z.date().optional(),
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

      const issue = await ctx.db.issue.update({
        where: { id: input.id },
        data: {
          assignedToId: input.providerId,
          managedById: ctx.session.user.id,
          status: 'ASSIGNED',
          scheduledDate: input.scheduledDate,
        },
        include: {
          assignedTo: { include: { user: true } },
          property: true,
        },
      })

      // Create timeline entry
      await ctx.db.issueTimeline.create({
        data: {
          issueId: input.id,
          status: 'ASSIGNED',
          changedById: ctx.session.user.id,
          notes: input.notes || `Assigned to ${issue.assignedTo?.user.name}`,
        },
      })

      // Send email notification to assigned provider
      try {
        const fullIssue = await ctx.db.issue.findUnique({
          where: { id: input.id },
          include: {
            property: {
              include: { owner: { include: { user: true } } }
            },
            assignedTo: { include: { user: true } }
          }
        })

        if (fullIssue?.assignedTo?.user) {
          const emailContent = emailTemplates.issueAssigned(
            fullIssue, 
            fullIssue.property, 
            fullIssue.assignedTo, 
            fullIssue.property.owner
          )
          await sendEmail({
            to: fullIssue.assignedTo.user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          })
        }
      } catch (error) {
        console.error('Failed to send issue assigned email:', error)
      }

      // Trigger workflow automation
      try {
        await WorkflowEngine.onIssueAssigned(input.id, input.providerId)
      } catch (error) {
        console.error('Failed to execute assignment workflow:', error)
      }

      return issue
    }),

  unassign: protectedProcedure
    .input(z.object({
      id: z.string(),
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

      const issue = await ctx.db.issue.update({
        where: { id: input.id },
        data: {
          assignedToId: null,
          status: 'OPEN',
          scheduledDate: null,
        },
      })

      // Create timeline entry
      await ctx.db.issueTimeline.create({
        data: {
          issueId: input.id,
          status: 'OPEN',
          changedById: ctx.session.user.id,
          notes: input.notes || 'Issue unassigned',
        },
      })

      return issue
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Only admins can delete issues
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete issues',
        })
      }

      await ctx.db.issue.delete({
        where: { id: input },
      })

      return { success: true }
    }),

})

// Helper method to check issue access  
async function checkIssueAccess(ctx: any, issue: any) {
    const userRole = ctx.session.user.role
    const userId = ctx.session.user.id

    if (['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'].includes(userRole)) {
      return true
    }

    if (userRole === 'OWNER') {
      const owner = await ctx.db.owner.findUnique({
        where: { userId },
      })
      return owner && issue.property.ownerId === owner.id
    }

    if (userRole === 'TENANT') {
      return issue.reportedById === userId || 
             (issue.property.currentTenantId && 
              await ctx.db.tenant.findFirst({
                where: { userId, id: issue.property.currentTenantId }
              }))
    }

    if (userRole === 'PROVIDER') {
      const provider = await ctx.db.provider.findUnique({
        where: { userId },
      })
      return provider && issue.assignedToId === provider.id
    }

    return false
}