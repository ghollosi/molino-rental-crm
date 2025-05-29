'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Shield, Palette, FileText, Globe, Settings } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const settingsCards = [
    {
      title: 'Felhasználók kezelése',
      description: 'Felhasználók létrehozása, szerkesztése és jogosultságok kezelése',
      icon: Users,
      href: '/dashboard/settings/users',
      adminOnly: true,
      status: 'Elérhető'
    },
    {
      title: 'Megjelenés',
      description: 'Témák, színek és layout beállítások testreszabása',
      icon: Palette,
      href: '/dashboard/settings/appearance',
      adminOnly: false,
      status: 'Fejlesztés alatt'
    },
    {
      title: 'Dokumentum sablonok',
      description: 'Szerződések, ajánlatok és egyéb dokumentumok sablonjai',
      icon: FileText,
      href: '/dashboard/settings/documents',
      adminOnly: false,
      status: 'Elérhető'
    },
    {
      title: 'Biztonsági beállítások',
      description: 'Jelszóházirend, munkamenet kezelés és biztonsági opciók',
      icon: Shield,
      href: '/dashboard/settings/security',
      adminOnly: true,
      status: 'Tervezett'
    },
    {
      title: 'Lokalizáció',
      description: 'Nyelv, pénznem, dátum és időformátum beállítások',
      icon: Globe,
      href: '/dashboard/settings/localization',
      adminOnly: false,
      status: 'Fejlesztés alatt'
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Beállítások</h1>
        <p className="text-muted-foreground">
          Rendszer és felhasználói beállítások kezelése
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsCards.map((card) => {
          const Icon = card.icon
          
          return (
            <Card key={card.title} className="relative">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  {card.adminOnly && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={
                      card.status === 'Elérhető' ? 'default' :
                      card.status === 'Fejlesztés alatt' ? 'secondary' :
                      'outline'
                    }
                  >
                    {card.status}
                  </Badge>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    disabled={card.status !== 'Elérhető'}
                  >
                    <Link href={card.href}>
                      Megnyitás
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Rendszer információk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Verzió</div>
              <div className="text-lg font-semibold">v1.10.0</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Utolsó frissítés</div>
              <div className="text-lg font-semibold">2025.05.29</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Környezet</div>
              <div className="text-lg font-semibold">Development</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}