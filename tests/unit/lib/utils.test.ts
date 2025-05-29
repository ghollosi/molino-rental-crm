import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    expect(cn('btn', isActive && 'active')).toBe('btn active')
  })

  it('should handle undefined and null values', () => {
    expect(cn('btn', undefined, null, 'primary')).toBe('btn primary')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('should handle tailwind merge conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})