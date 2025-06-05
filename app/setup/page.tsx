'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const setupDatabase = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage('✅ Database setup successful! You can now login with admin@molino.com / admin123')
      } else {
        setMessage(`❌ Error: ${data.error} - ${data.details}`)
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createAdmin = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage('✅ Admin user created! You can now login with admin@molino.com / admin123')
      } else {
        setMessage(`❌ Error: ${data.error} - ${data.details}`)
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const forceLogin = () => {
    window.location.href = '/api/force-login'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Molino CRM Database Setup
        </h1>
        
        <div className="space-y-4">
          <Button 
            onClick={setupDatabase} 
            disabled={loading}
            className="w-full"
            variant="default"
          >
            {loading ? 'Setting up...' : 'Setup Complete Database'}
          </Button>
          
          <Button 
            onClick={createAdmin} 
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? 'Creating...' : 'Create Admin User Only'}
          </Button>
          
          <Button 
            onClick={forceLogin} 
            disabled={loading}
            className="w-full"
            variant="secondary"
          >
            Force Login (Bypass Auth)
          </Button>
        </div>
        
        {message && (
          <div className={`mt-4 p-3 rounded text-sm ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Default credentials:</p>
          <p className="font-mono">admin@molino.com / admin123</p>
        </div>
      </div>
    </div>
  )
}