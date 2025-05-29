'use client'

import { useState } from 'react'

export default function TestOwnerCreate() {
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
      console.log('Sending direct API request...')
      
      const response = await fetch('/api/create-owner-direct', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok && data.success) {
        setSuccess(true)
        setError('')
        setTimeout(() => {
          window.location.href = '/dashboard/owners'
        }, 2000)
      } else {
        const errorMsg = data.error || 'Hiba történt a tulajdonos létrehozásánál'
        setError(errorMsg)
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Network error:', error)
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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 TEST - Tulajdonos létrehozás (Direct API)</h1>
      <p style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        Ez a teszt oldal közvetlenül a `/api/create-owner-direct` endpoint-ot hívja, megkerülve a tRPC-t.
      </p>

      {success && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
          ✅ Tulajdonos sikeresen létrehozva! Átirányítás a listához...
        </div>
      )}

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Név *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Teljes név"
            required
            disabled={loading}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Email cím *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="test@example.com"
            required
            disabled={loading}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Jelszó *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Legalább 6 karakter"
            required
            disabled={loading}
            minLength={6}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div>
          <label>Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+36 20 123 4567"
            disabled={loading}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading || !formData.name || !formData.email || !formData.password}
            style={{ 
              flex: 1, 
              padding: '10px', 
              background: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Létrehozás...' : 'Tulajdonos létrehozása'}
          </button>
          
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard/owners'}
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Vissza
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>DEBUG INFO:</strong><br/>
        - Endpoint: /api/create-owner-direct<br/>
        - Method: POST<br/>
        - No tRPC involved<br/>
        - Direct Prisma calls<br/>
      </div>
    </div>
  )
}