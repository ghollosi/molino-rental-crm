'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmergencyDashboard() {
  const [credentials, setCredentials] = useState({ email: 'admin@molino.com', password: 'admin123' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);

  const handleEmergencyLogin = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/emergency-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();
      
      if (result.success) {
        setStatus('success');
        setMessage('Emergency login successful! Checking database...');
        
        // Try to get dashboard data
        setTimeout(async () => {
          try {
            const dashResponse = await fetch('/api/simple-dashboard');
            const dashData = await dashResponse.json();
            setDashboardData(dashData);
          } catch (error) {
            console.error('Dashboard data error:', error);
          }
        }, 1000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Login failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Connection error');
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/quick-test');
      const result = await response.json();
      setDashboardData(result);
    } catch (error) {
      setDashboardData({ error: 'Connection failed' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">🚨 Emergency Dashboard</CardTitle>
            <CardDescription>
              Production debugging & emergency access for Molino Rental CRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleEmergencyLogin}
                disabled={status === 'loading'}
                variant={status === 'success' ? 'default' : 'destructive'}
              >
                {status === 'loading' ? 'Logging in...' : 'Emergency Login'}
              </Button>
              
              <Button 
                onClick={testDatabaseConnection}
                variant="outline"
              >
                Test Database
              </Button>

              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/check-password', { method: 'POST' });
                    const result = await response.json();
                    setDashboardData(result);
                  } catch (error) {
                    setDashboardData({ error: 'Password check failed' });
                  }
                }}
                variant="secondary"
              >
                Check Password
              </Button>

              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sql-fix-password', { method: 'POST' });
                    const result = await response.json();
                    setDashboardData(result);
                    if (result.success) {
                      setMessage('✅ Admin password fixed with raw SQL! Try login now.');
                      setStatus('success');
                    } else {
                      setMessage('❌ Password fix failed: ' + result.error);
                      setStatus('error');
                    }
                  } catch (error) {
                    setDashboardData({ error: 'Password fix failed' });
                    setMessage('❌ Connection error during password fix');
                    setStatus('error');
                  }
                }}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                🔧 Fix Password (SQL)
              </Button>
            </div>

            {message && (
              <div className={`p-3 rounded ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        {dashboardData && (
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(dashboardData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Production Issues Identified</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>DATABASE_URL format validation error in Prisma</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>Missing database tables (Owner, Property, Tenant, Provider)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span>NextAuth session authentication blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>App deployment successful</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Vercel serverless functions working</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>1.</strong> Fix DATABASE_URL in Vercel environment variables</p>
            <p><strong>2.</strong> Run database schema creation manually via Supabase Dashboard</p>
            <p><strong>3.</strong> Test normal login flow</p>
            <p><strong>4.</strong> Verify dashboard functionality</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}