'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  FileSignature,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useSidebar } from '@/contexts/sidebar-context'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Ingatlanok', href: '/dashboard/properties', icon: Building },
  { name: 'Tulajdonosok', href: '/dashboard/owners', icon: Users },
  { name: 'Bérlők', href: '/dashboard/tenants', icon: User },
  { name: 'Szolgáltatók', href: '/dashboard/providers', icon: Wrench },
  { name: 'Hibabejelentések', href: '/dashboard/issues', icon: ClipboardList },
  { name: 'Ajánlatok', href: '/dashboard/offers', icon: FileText },
  { name: 'Szerződések', href: '/dashboard/contracts', icon: FileSignature },
  { name: 'Szolgáltató Párosítás', href: '/dashboard/provider-matching', icon: Zap, adminOnly: true },
  { name: 'Jelentések', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Felhasználók', href: '/dashboard/users', icon: Users, adminOnly: true },
  { name: 'Beállítások', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, toggleCollapse } = useSidebar()

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly) {
      return ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(session?.user?.role || '')
    }
    return true
  })

  return (
    <div className={cn(
      "hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300",
      isCollapsed ? "md:w-20" : "md:w-64"
    )}>
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 py-6 relative">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">
              Molino RENTAL
            </h1>
          )}
          {isCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 text-center w-full">
              MR
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 shadow-sm hover:shadow-md"
            onClick={toggleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    isCollapsed ? 'justify-center' : ''
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isCollapsed ? 'mr-0' : 'mr-3',
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}