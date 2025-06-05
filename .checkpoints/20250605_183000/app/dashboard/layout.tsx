'use client'

import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { MobileNavigation } from '@/components/mobile/mobile-navigation'
import { cn } from '@/lib/utils'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "md:pl-20" : "md:pl-64",
        "pb-16 md:pb-0" // Padding bottom for mobile navigation
      )}>
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
      <MobileNavigation />
      <PWAInstallPrompt />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}