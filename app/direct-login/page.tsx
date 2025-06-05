'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DirectLoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const directLogin = async () => {
    setLoading(true)
    try {
      // Test the credentials first
      const testResponse = await fetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@molino.com',
          password: 'admin123'
        })
      })
      
      const testResult = await testResponse.json()
      
      if (testResult.success) {
        // Directly redirect to dashboard
        localStorage.setItem('temp-admin-session', JSON.stringify({
          user: testResult.user,
          timestamp: Date.now()
        }))
        
        router.push('/dashboard')
      } else {
        alert('Login failed: ' + testResult.error)
      }
    } catch (error) {
      alert('Error: ' + error)
    }
    setLoading(false)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h1>Direct Admin Login</h1>
      <p>Bypass NextAuth and login directly</p>
      
      <button 
        onClick={directLogin}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '20px'
        }}
      >
        {loading ? 'Bejelentkezés...' : 'Bejelentkezés admin@molino.com-mal'}
      </button>
      
      <a 
        href="/login" 
        style={{ marginTop: '20px', color: '#666' }}
      >
        Vissza a normál bejelentkezéshez
      </a>
    </div>
  )
}