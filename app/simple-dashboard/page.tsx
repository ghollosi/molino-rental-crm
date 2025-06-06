'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  success: boolean;
  stats: {
    users: number;
    owners: number;
    tenants: number;
    providers: number;
    properties: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
  }>;
  error?: string;
}

export default function SimpleDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/simple-dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Dashboard fetch error:', error);
        setData({ 
          success: false, 
          error: error.message,
          stats: { users: 0, owners: 0, tenants: 0, providers: 0, properties: 0 },
          recentUsers: []
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Simple Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Simple Dashboard</h1>
        <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px' }}>
          <h3>Error:</h3>
          <p>{data?.error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '2rem', color: '#1976d2' }}>
        🎉 Molino Rental CRM - Simple Dashboard
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '1rem', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{data.stats.users}</h2>
          <p style={{ margin: 0, color: '#666' }}>Total Users</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '1rem', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{data.stats.owners}</h2>
          <p style={{ margin: 0, color: '#666' }}>Owners</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff3e0', 
          padding: '1rem', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{data.stats.tenants}</h2>
          <p style={{ margin: 0, color: '#666' }}>Tenants</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f3e5f5', 
          padding: '1rem', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{data.stats.providers}</h2>
          <p style={{ margin: 0, color: '#666' }}>Providers</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#e0f2f1', 
          padding: '1rem', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{data.stats.properties}</h2>
          <p style={{ margin: 0, color: '#666' }}>Properties</p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '1.5rem', 
        borderRadius: '8px' 
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Recent Users</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '4px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUsers.map((user, index) => (
                <tr key={user.id} style={{ 
                  borderBottom: '1px solid #eee',
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                }}>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>{user.firstName} {user.lastName}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      backgroundColor: user.role === 'ADMIN' ? '#e3f2fd' : '#f5f5f5',
                      color: user.role === 'ADMIN' ? '#1976d2' : '#666'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      backgroundColor: user.isActive ? '#e8f5e8' : '#ffebee',
                      color: user.isActive ? '#2e7d32' : '#c62828'
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ color: '#2e7d32', margin: '0 0 0.5rem 0' }}>✅ Production Status</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>✅ Application deployed and running</li>
          <li>✅ Database connection working</li>
          <li>✅ Data retrieval successful</li>
          <li>✅ Basic functionality operational</li>
        </ul>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        <p>
          <strong>Next steps:</strong> Complete tRPC session authentication setup for full dashboard functionality.
        </p>
        <p>
          <strong>Bypass URLs:</strong> 
          <a href="/api/bypass-login" style={{ marginLeft: '0.5rem', color: '#1976d2' }}>Bypass Login</a> |
          <a href="/api/force-login" style={{ marginLeft: '0.5rem', color: '#1976d2' }}>Force Login</a>
        </p>
      </div>
    </div>
  );
}