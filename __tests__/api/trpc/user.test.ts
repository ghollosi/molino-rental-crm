import { createTRPCMsw } from 'msw-trpc'
import { userRouter } from '@/src/server/routers/user'
import type { User } from '@prisma/client'

// Mock database
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  password: 'hashed-password',
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN',
  language: 'HU',
  phone: '+36 20 123 4567',
  isActive: true,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
}

// Mock tRPC context
const mockContext = {
  session: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'ADMIN',
    },
  },
  db: mockPrisma,
}

describe('User Router', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const caller = userRouter.createCaller(mockContext as any)
      const result = await caller.getCurrentUser()

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        phone: mockUser.phone,
        role: mockUser.role,
        language: mockUser.language,
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          language: true,
        },
      })
    })

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const caller = userRouter.createCaller(mockContext as any)
      
      await expect(caller.getCurrentUser()).rejects.toThrow('Session user not found in database')
    })

    it('should throw unauthorized error if no session', async () => {
      const noSessionContext = { ...mockContext, session: null }
      
      const caller = userRouter.createCaller(noSessionContext as any)
      
      await expect(caller.getCurrentUser()).rejects.toThrow('UNAUTHORIZED')
    })
  })

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = {
        id: 'test-user-id',
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        phone: '+36 30 456 7890',
      }

      const updatedUser = { ...mockUser, ...updateData }
      mockPrisma.user.update.mockResolvedValue(updatedUser)

      const caller = userRouter.createCaller(mockContext as any)
      const result = await caller.update(updateData)

      expect(result).toEqual(updatedUser)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@example.com',
          phone: '+36 30 456 7890',
        },
      })
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        id: 'test-user-id',
        email: 'invalid-email', // Invalid email format
      }

      const caller = userRouter.createCaller(mockContext as any)
      
      await expect(caller.update(invalidData)).rejects.toThrow()
    })

    it('should require user ID', async () => {
      const dataWithoutId = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const caller = userRouter.createCaller(mockContext as any)
      
      await expect(caller.update(dataWithoutId as any)).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should return paginated user list for admin', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-2', email: 'user2@example.com' }]
      const mockResult = {
        data: users,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }

      mockPrisma.user.findMany.mockResolvedValue(users)
      mockPrisma.user.count = jest.fn().mockResolvedValue(2)

      const caller = userRouter.createCaller(mockContext as any)
      const result = await caller.list({ page: 1, limit: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(2)
      expect(result.meta.page).toBe(1)
    })

    it('should throw unauthorized for non-admin users', async () => {
      const nonAdminContext = {
        ...mockContext,
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            role: 'TENANT',
          },
        },
      }

      const caller = userRouter.createCaller(nonAdminContext as any)
      
      await expect(caller.list({ page: 1, limit: 10 })).rejects.toThrow('FORBIDDEN')
    })
  })
})