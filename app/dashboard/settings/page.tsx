'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, Building, Mail, Bell, Shield, 
  CreditCard, MessageCircle, DollarSign, 
  Calculator, BarChart3, Calendar,
  Settings2, Workflow, Cloud
} from 'lucide-react'
import Link from 'next/link'

const SETTINGS_CATEGORIES = {
  general: {
    title: 'Általános',
    icon: Settings2,
    items: [
      { id: 'profile', title: 'Profil', icon: User, description: 'Felhasználói adatok kezelése', href: '/dashboard/settings/profile' },
      { id: 'company', title: 'Cégadatok', icon: Building, description: 'Céginformációk és üzleti adatok', href: '/dashboard/settings/company' },
      { id: 'email', title: 'Email szolgáltatás', icon: Mail, description: 'Resend email konfiguráció', href: '/dashboard/settings/email' },
      { id: 'workflow', title: 'Workflow', icon: Workflow, description: 'Automatizációs szabályok', href: '/dashboard/settings/workflow' },
      { id: 'cloud-storage', title: 'Cloud Storage', icon: Cloud, description: 'Cloudflare R2 storage', href: '/dashboard/settings/cloud-storage' },
      { id: 'rate-limit', title: 'Rate Limiting', icon: Shield, description: 'API védelem beállítások', href: '/dashboard/settings/rate-limit' }
    ]
  },
  system: {
    title: 'Rendszer',
    icon: Settings2,
    items: [
      { id: 'email', title: 'Email szolgáltatás', icon: Mail, description: 'Resend email konfiguráció' },
      { id: 'workflow', title: 'Workflow', icon: Settings2, description: 'Automatizációs szabályok' },
      { id: 'rate-limit', title: 'Rate Limiting', icon: Shield, description: 'API védelem beállítások' },
      { id: 'sentry', title: 'Error Tracking', icon: Shield, description: 'Sentry hibakezelés' }
    ]
  },
  integrations: {
    title: 'Spanyol Integrációk',
    icon: CreditCard,
    items: [
      { 
        id: 'zoho', 
        title: 'Zoho Books', 
        icon: CreditCard, 
        description: 'Spanyol IVA számlázás',
        badge: 'Aktív',
        href: '/dashboard/settings/zoho'
      },
      { 
        id: 'caixabank', 
        title: 'CaixaBank PSD2', 
        icon: DollarSign, 
        description: 'Automatikus párosítás',
        badge: 'Aktív',
        href: '/dashboard/settings/caixabank'
      },
      { 
        id: 'whatsapp', 
        title: 'WhatsApp Business', 
        icon: MessageCircle, 
        description: 'Spanyol template üzenetek',
        badge: 'Aktív',
        href: '/dashboard/settings/whatsapp'
      },
      { 
        id: 'booking', 
        title: 'Booking.com', 
        icon: Calendar, 
        description: 'Dinamikus árazás és sync',
        badge: 'Aktív',
        href: '/dashboard/settings/booking'
      },
      { 
        id: 'spanish-vat', 
        title: 'Spanish VAT', 
        icon: Calculator, 
        description: 'IVA kalkulátor',
        badge: 'Elérhető',
        href: '/dashboard/settings/spanish-vat'
      },
      { 
        id: 'reconciliation', 
        title: 'Payment Reconciliation', 
        icon: BarChart3, 
        description: 'Automatikus párosítás monitor',
        badge: 'Aktív',
        href: '/dashboard/settings/payment-reconciliation'
      }
    ]
  }
}

export default function SettingsPage() {
  
  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case 'Aktív': return 'default'
      case 'Elérhető': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Beállítások</h1>
        <p className="text-gray-600">
          Rendszer és integráció beállítások kezelése
        </p>
      </div>

      {/* Spanish Integrations Highlight */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">🇪🇸</span>
          <div>
            <h2 className="text-xl font-semibold text-blue-900">Spanyol Piac - Teljes Integráció</h2>
            <p className="text-blue-700">Mind a 6 kritikus integráció implementálva és tesztelésre kész!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>4 aktív integráció</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>90%+ automatizáció</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Production ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Alicante ready</span>
          </div>
        </div>
      </div>

      {/* Spanish Integrations Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">🇪🇸 Spanyol Integrációk</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTINGS_CATEGORIES.integrations.items.map((item) => {
            const IconComponent = item.icon
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{item.title}</h4>
                        {item.badge && (
                          <Badge variant={getBadgeVariant(item.badge)}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {item.description}
                      </p>
                      
                      <Link href={item.href}>
                        <Button size="sm" className="w-full">
                          Tesztelő megnyitása
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* General Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">⚙️ Általános Beállítások</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTINGS_CATEGORIES.general.items.map((item) => {
            const IconComponent = item.icon
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {item.description}
                      </p>
                      
                      <Link href={item.href}>
                        <Button size="sm" variant="outline" className="w-full">
                          Konfigurálás
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}