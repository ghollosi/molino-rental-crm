'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AltLoginPage() {
  const [email, setEmail] = useState('admin@molino.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/direct-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      
      if (result.success) {
        // Force reload to apply cookies
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🚀 Alternative Login</CardTitle>
          <CardDescription>
            Direct authentication bypassing NextAuth issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}

          <Button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Direct Login'}
          </Button>

          <div className="text-sm text-gray-600 text-center">
            <p>This bypasses NextAuth and creates a direct session.</p>
            <p className="mt-2">Default: admin@molino.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}