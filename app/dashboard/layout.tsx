import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-64">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}