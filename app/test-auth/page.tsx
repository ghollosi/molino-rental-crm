'use client'

import { useState } from 'react'

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@molino.com',
          password: 'admin123'
        })
      })
      
      const data = await response.json()
      setResult(data)
      console.log('Test result:', data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Failed' })
      console.error('Test error:', error)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Auth Test Page</h1>
      
      <button 
        onClick={testLogin} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Login'}
      </button>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap'
        }}>
          <h3>Result:</h3>
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  )
}