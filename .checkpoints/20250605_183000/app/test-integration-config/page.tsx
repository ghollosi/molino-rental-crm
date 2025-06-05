'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc'

export default function TestIntegrationConfigPage() {
  const { data: configs, refetch } = api.integrationConfig.getAll.useQuery()
  const { data: zohoConfig } = api.integrationConfig.get.useQuery(
    { type: 'ZOHO_BOOKS' },
    { enabled: true }
  )

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integration Configuration Test</h1>
          <p className="text-muted-foreground">
            Testing the new integration configuration system
          </p>
        </div>
        <Button onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Configuration List */}
        <Card>
          <CardHeader>
            <CardTitle>All Integration Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            {configs ? (
              <div className="space-y-2">
                {configs.map((config: any) => (
                  <div key={config.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{config.name}</span>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant={config.status === 'ACTIVE' ? 'default' : 'destructive'}>
                        {config.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Loading configurations...</p>
            )}
          </CardContent>
        </Card>

        {/* Zoho Configuration Details */}
        <Card>
          <CardHeader>
            <CardTitle>Zoho Books Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {zohoConfig ? (
              <div className="space-y-2">
                <p><strong>Status:</strong> {zohoConfig.status}</p>
                <p><strong>Enabled:</strong> {zohoConfig.isEnabled ? 'Yes' : 'No'}</p>
                <p><strong>Version:</strong> {zohoConfig.version}</p>
                <p><strong>Last Updated:</strong> {new Date(zohoConfig.updatedAt).toLocaleString()}</p>
                {zohoConfig.lastTested && (
                  <p><strong>Last Tested:</strong> {new Date(zohoConfig.lastTested).toLocaleString()}</p>
                )}
                <p><strong>Config Loaded:</strong> {zohoConfig.config ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p>No Zoho configuration found or loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Environment Variable Test */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variable Fallback Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This system will first try to load configuration from the database, 
              and fall back to environment variables if no database configuration is found.
            </p>
            <div className="mt-4 p-4 bg-muted rounded">
              <p><strong>Database-first approach:</strong></p>
              <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
                <li>Query IntegrationConfig table for the requested integration type</li>
                <li>If found and enabled, decrypt and return the configuration</li>
                <li>If not found or disabled, fall back to environment variables</li>
                <li>Return the merged configuration with defaults</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}