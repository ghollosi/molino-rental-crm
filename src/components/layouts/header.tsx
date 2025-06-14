'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, LogOut, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'
import Image from 'next/image'

export function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: currentUser } = api.user.getCurrentUser.useQuery()
  const { data: company } = api.company.get.useQuery()

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    })
  }

  const displayName = currentUser 
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim() 
    : session?.user?.email?.split('@')[0] || 'Felhasználó'

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Company Logo */}
          {company?.logo ? (
            <div className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <Image
                  src={company.logo}
                  alt={company.name || 'Cég logó'}
                  fill
                  sizes="32px"
                  className="object-contain rounded"
                />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {company.name || 'Vezérlőpult'}
              </h2>
            </div>
          ) : (
            <h2 className="text-lg font-semibold text-gray-900">
              {company?.name || 'Vezérlőpult'}
            </h2>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email || session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Beállítások</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Kijelentkezés</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}