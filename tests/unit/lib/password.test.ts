import { describe, it, expect } from 'vitest'
import { generatePassword, hashPassword, verifyPassword } from '@/src/lib/password'

describe('Password utilities', () => {
  describe('generatePassword', () => {
    it('should generate password with default length of 12', () => {
      const password = generatePassword()
      expect(password).toHaveLength(12)
    })

    it('should generate password with custom length', () => {
      const password = generatePassword(16)
      expect(password).toHaveLength(16)
    })

    it('should generate different passwords each time', () => {
      const password1 = generatePassword()
      const password2 = generatePassword()
      expect(password1).not.toBe(password2)
    })

    it('should contain alphanumeric characters and symbols', () => {
      const password = generatePassword(20)
      expect(password).toMatch(/^[a-zA-Z0-9!@#$%^&*]+$/)
    })
  })

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hashed = await hashPassword(password)
      
      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(hashed.length).toBeGreaterThan(20) // bcrypt hashes are longer
    })

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2) // Salt should make them different
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testpassword123'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(password, hashed)
      
      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword456'
      const hashed = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hashed)
      
      expect(isValid).toBe(false)
    })
  })
})