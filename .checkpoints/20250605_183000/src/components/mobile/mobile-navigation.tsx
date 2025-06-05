'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Building, 
  Users, 
  Wrench, 
  FileText, 
  Menu,
  X,
  Plus,
  Camera,
  Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

interface MobileNavItem {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
}

export function MobileNavigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems: MobileNavItem[] = [
    {
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      label: 'Főoldal'
    },
    {
      href: '/dashboard/properties',
      icon: <Building className="h-5 w-5" />,
      label: 'Ingatlanok'
    },
    {
      href: '/dashboard/issues',
      icon: <Wrench className="h-5 w-5" />,
      label: 'Hibák',
      badge: 3 // Nyitott hibák száma
    },
    {
      href: '/dashboard/tenants',
      icon: <Users className="h-5 w-5" />,
      label: 'Bérlők'
    },
    {
      href: '/dashboard/contracts',
      icon: <FileText className="h-5 w-5" />,
      label: 'Szerződések'
    }
  ]

  return (
    <>
      {/* Mobil alsó navigáció */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 px-1 relative",
                  isActive ? "text-blue-600" : "text-gray-600"
                )}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobil hamburger menü további opciókhoz */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Menü</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col space-y-4 mt-6">
              <Link 
                href="/dashboard/issues/new" 
                className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 text-blue-700"
                onClick={() => setIsOpen(false)}
              >
                <Plus className="h-5 w-5" />
                <span>Új hibabejelentés</span>
              </Link>
              
              <Link 
                href="/dashboard/issues/camera" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Camera className="h-5 w-5" />
                <span>Fotó hibabejelentés</span>
              </Link>

              <Link 
                href="/dashboard/notifications" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Bell className="h-5 w-5" />
                <span>Értesítések</span>
                <Badge variant="outline" className="ml-auto">5</Badge>
              </Link>

              <hr className="my-4" />

              <Link 
                href="/dashboard/owners" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span>Tulajdonosok</span>
              </Link>

              <Link 
                href="/dashboard/providers" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Wrench className="h-5 w-5" />
                <span>Szolgáltatók</span>
              </Link>

              <Link 
                href="/dashboard/reports" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <FileText className="h-5 w-5" />
                <span>Jelentések</span>
              </Link>

              <hr className="my-4" />

              <Link 
                href="/dashboard/settings" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <span>Beállítások</span>
              </Link>

              <Link 
                href="/api/auth/signout" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 text-red-600"
                onClick={() => setIsOpen(false)}
              >
                <span>Kijelentkezés</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}