'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  Building,
  Users,
  Wrench,
  FileText,
  BarChart3,
  Settings,
  User,
  ClipboardList,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Ingatlanok', href: '/dashboard/properties', icon: Building },
  { name: 'Tulajdonosok', href: '/dashboard/owners', icon: Users },
  { name: 'Bérlők', href: '/dashboard/tenants', icon: User },
  { name: 'Szolgáltatók', href: '/dashboard/providers', icon: Wrench },
  { name: 'Hibabejelentések', href: '/dashboard/issues', icon: ClipboardList },
  { name: 'Ajánlatok', href: '/dashboard/offers', icon: FileText },
  { name: 'Jelentések', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Beállítások', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900">
            Molino RENTAL
          </h1>
        </div>
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}