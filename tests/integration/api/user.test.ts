import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { userRouter } from '@/src/server/routers/user'
import { createCallerFactory } from '@trpc/server'

// Mock database
const mockDb = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}

// Mock context
const createMockContext = (userRole: string = 'ADMIN') => ({
  db: mockDb,
  session: {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: userRole,
    },
  },
})

const createCaller = createCallerFactory(userRouter)

describe('User API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('user.list', () => {
    it('should return paginated user list for admin', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@test.com',
          role: 'TENANT',
          language: 'HU',
          phone: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockDb.user.findMany.mockResolvedValue(mockUsers)
      mockDb.user.count.mockResolvedValue(1)

      const caller = createCaller(createMockContext('ADMIN'))
      const result = await caller.list({ page: 1, limit: 10 })

      expect(result.users).toEqual(mockUsers)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
    })

    it('should throw error for non-admin users', async () => {
      const caller = createCaller(createMockContext('TENANT'))

      await expect(caller.list({ page: 1, limit: 10 })).rejects.toThrow(
        TRPCError
      )
    })

    it('should handle search filtering', async () => {
      mockDb.user.findMany.mockResolvedValue([])
      mockDb.user.count.mockResolvedValue(0)

      const caller = createCaller(createMockContext('ADMIN'))
      await caller.list({ page: 1, limit: 10, search: 'test' })

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          language: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle role filtering', async () => {
      mockDb.user.findMany.mockResolvedValue([])
      mockDb.user.count.mockResolvedValue(0)

      const caller = createCaller(createMockContext('ADMIN'))
      await caller.list({ page: 1, limit: 10, role: 'TENANT' })

      expect(mockDb.user.findMany).toHaveBeenCalledWith({
        where: { role: 'TENANT' },
        skip: 0,
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          language: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('user.create', () => {
    it('should create new user successfully', async () => {
      const newUser = {
        id: 'new-user-id',
        name: 'New User',
        email: 'newuser@test.com',
        role: 'TENANT',
        language: 'HU',
        phone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.findUnique.mockResolvedValue(null) // Email doesn't exist
      mockDb.user.create.mockResolvedValue(newUser)

      const caller = createCaller(createMockContext('ADMIN'))
      const result = await caller.create({
        name: 'New User',
        email: 'newuser@test.com',
        role: 'TENANT',
        language: 'HU',
      })

      expect(result.name).toBe('New User')
      expect(result.email).toBe('newuser@test.com')
      expect(result.role).toBe('TENANT')
    })

    it('should throw error if email already exists', async () => {
      mockDb.user.findUnique.mockResolvedValue({ id: 'existing-user' })

      const caller = createCaller(createMockContext('ADMIN'))

      await expect(
        caller.create({
          name: 'New User',
          email: 'existing@test.com',
          role: 'TENANT',
          language: 'HU',
        })
      ).rejects.toThrow('Email already exists')
    })

    it('should throw error for non-admin users', async () => {
      const caller = createCaller(createMockContext('TENANT'))

      await expect(
        caller.create({
          name: 'New User',
          email: 'newuser@test.com',
          role: 'TENANT',
          language: 'HU',
        })
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('user.createAdmin', () => {
    it('should create admin user successfully', async () => {
      const newAdmin = {
        id: 'new-admin-id',
        name: 'New Admin',
        email: 'admin@test.com',
        role: 'EDITOR_ADMIN',
        language: 'HU',
        phone: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue(newAdmin)
      mockDb.user.findMany.mockResolvedValue([]) // No existing admins

      const caller = createCaller(createMockContext('ADMIN'))
      const result = await caller.createAdmin({
        name: 'New Admin',
        email: 'admin@test.com',
        role: 'EDITOR_ADMIN',
        language: 'HU',
      })

      expect(result.role).toBe('EDITOR_ADMIN')
    })

    it('should throw error for non-main-admin users', async () => {
      const caller = createCaller(createMockContext('EDITOR_ADMIN'))

      await expect(
        caller.createAdmin({
          name: 'New Admin',
          email: 'admin@test.com',
          role: 'EDITOR_ADMIN',
          language: 'HU',
        })
      ).rejects.toThrow('Only main admins can create admin users')
    })
  })

  describe('user.delete', () => {
    it('should delete user successfully', async () => {
      const userToDelete = {
        id: 'user-to-delete',
        owner: null,
        tenant: { contracts: [] },
        provider: { assignedIssues: [] },
      }

      mockDb.user.findUnique.mockResolvedValue(userToDelete)
      mockDb.user.delete.mockResolvedValue(userToDelete)

      const caller = createCaller(createMockContext('ADMIN'))
      const result = await caller.delete('user-to-delete')

      expect(result.success).toBe(true)
    })

    it('should throw error when deleting own account', async () => {
      const caller = createCaller(createMockContext('ADMIN'))

      await expect(caller.delete('test-user-id')).rejects.toThrow(
        'Cannot delete your own account'
      )
    })

    it('should throw error for non-main-admin users', async () => {
      const caller = createCaller(createMockContext('EDITOR_ADMIN'))

      await expect(caller.delete('other-user-id')).rejects.toThrow(
        'Only main admins can delete users'
      )
    })
  })
})