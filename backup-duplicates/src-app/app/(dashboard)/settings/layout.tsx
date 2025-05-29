'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings, Users, Palette, FileText, Shield, Globe } from 'lucide-react'

const settingsNavigation = [
  {
    name: 'Általános',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Alapvető beállítások'
  },
  {
    name: 'Felhasználók',
    href: '/dashboard/settings/users',
    icon: Users,
    description: 'Felhasználók kezelése',
    adminOnly: true
  },
  {
    name: 'Megjelenés',
    href: '/dashboard/settings/appearance',
    icon: Palette,
    description: 'Témák és színek'
  },
  {
    name: 'Dokumentumok',
    href: '/dashboard/settings/documents',
    icon: FileText,
    description: 'Sablonok és dokumentumok'
  },
  {
    name: 'Biztonság',
    href: '/dashboard/settings/security',
    icon: Shield,
    description: 'Biztonsági beállítások',
    adminOnly: true
  },
  {
    name: 'Lokalizáció',
    href: '/dashboard/settings/localization',
    icon: Globe,
    description: 'Nyelv és formátum'
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside className="lg:w-1/5">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {settingsNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  'border border-transparent px-3 py-2 hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                <div className="grid gap-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground hidden lg:block">
                    {item.description}
                  </div>
                </div>
                {item.adminOnly && (
                  <Shield className="h-3 w-3 ml-auto text-orange-500" />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
      <div className="flex-1 lg:max-w-4xl">
        {children}
      </div>
    </div>
  )
}