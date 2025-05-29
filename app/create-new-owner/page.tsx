'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateNewOwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Név, email és jelszó megadása kötelező')
      return
    }
    
    if (formData.password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      console.log('🚀 BYPASS CACHE - DIRECT API CALL', new Date().toISOString())
      
      const response = await fetch('/api/create-owner-direct', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
        })
      })

      console.log('✅ Response status:', response.status)
      const data = await response.json()
      console.log('📋 Response data:', data)
      
      if (response.ok && data.success) {
        setSuccess(true)
        setError('')
        setTimeout(() => {
          router.push('/dashboard/owners')
        }, 2000)
      } else {
        const errorMsg = data.error || 'Hiba történt a tulajdonos létrehozásánál'
        setError(errorMsg)
        console.error('❌ API error:', data)
      }
    } catch (error) {
      console.error('🔥 Network error:', error)
      setError('Hálózati hiba történt. Kérlek próbáld újra.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }}>
        <h1 style={{ marginBottom: '10px', fontSize: '24px', color: '#1f2937' }}>
          🏠 Új tulajdonos létrehozása
        </h1>
        
        <div style={{ 
          background: '#dbeafe', 
          color: '#1e40af', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ⚡ CACHE BYPASS VERSION - Ez egy új URL, amely megkerüli a cache problémákat
        </div>

        {success && (
          <div style={{ 
            background: '#d1fae5', 
            color: '#065f46', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            border: '1px solid #a7f3d0'
          }}>
            ✅ Tulajdonos sikeresen létrehozva! Átirányítás a listához...
          </div>
        )}

        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            border: '1px solid #fca5a5'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              Név *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Teljes név"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: loading ? '#f3f4f6' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              Email cím *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="test@example.com"
              required
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: loading ? '#f3f4f6' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              Jelszó *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Legalább 6 karakter"
              required
              disabled={loading}
              minLength={6}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: loading ? '#f3f4f6' : 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+36 20 123 4567"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: loading ? '#f3f4f6' : 'white'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.email || !formData.password}
              style={{ 
                flex: 1,
                padding: '12px 24px', 
                background: loading || !formData.name || !formData.email || !formData.password ? '#9ca3af' : '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading || !formData.name || !formData.email || !formData.password ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? '⏳ Létrehozás...' : '✅ Tulajdonos létrehozása'}
            </button>
            
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard/owners'}
              disabled={loading}
              style={{ 
                padding: '12px 24px', 
                background: '#6b7280', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              ← Vissza
            </button>
          </div>
        </form>

        <div style={{ 
          marginTop: '24px', 
          fontSize: '12px', 
          color: '#6b7280',
          background: '#f3f4f6',
          padding: '12px',
          borderRadius: '4px'
        }}>
          <strong>🔧 DEBUG INFO:</strong><br/>
          • Endpoint: /api/create-owner-direct<br/>
          • Method: POST<br/>
          • Cache: Disabled<br/>
          • tRPC: Bypassed<br/>
          • URL: /create-new-owner (új!)<br/>
        </div>
      </div>
    </div>
  )
}