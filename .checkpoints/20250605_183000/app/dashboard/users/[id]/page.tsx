'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  Building,
  FileText,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

const roleTranslations = {
  'ADMIN': 'Adminisztrátor',
  'EDITOR_ADMIN': 'Szerkesztő admin',
  'OFFICE_ADMIN': 'Irodai admin',
  'OWNER': 'Tulajdonos',
  'SERVICE_MANAGER': 'Szolgáltatás manager',
  'PROVIDER': 'Szolgáltató',
  'TENANT': 'Bérlő'
}

const roleBadgeColors: Record<string, string> = {
  'ADMIN': 'bg-red-100 text-red-800',
  'EDITOR_ADMIN': 'bg-orange-100 text-orange-800',
  'OFFICE_ADMIN': 'bg-yellow-100 text-yellow-800',
  'OWNER': 'bg-blue-100 text-blue-800',
  'SERVICE_MANAGER': 'bg-purple-100 text-purple-800',
  'PROVIDER': 'bg-green-100 text-green-800',
  'TENANT': 'bg-gray-100 text-gray-800'
}

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const router = useRouter()
  const { data: user, isLoading, error } = api.user.getById.useQuery(params.id)

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Betöltés...</div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Vissza a felhasználókhoz
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Felhasználó nem található.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a felhasználókhoz
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Info */}
        <div className="flex-1 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={roleBadgeColors[user.role] || 'bg-gray-100 text-gray-800'}>
                      {roleTranslations[user.role as keyof typeof roleTranslations] || user.role}
                    </Badge>
                    {user.isActive ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700">Aktív</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700">Inaktív</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button asChild>
                <Link href={`/dashboard/users/${user.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Szerkesztés
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                {user.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefon
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Szerepkör
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {roleTranslations[user.role as keyof typeof roleTranslations] || user.role}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Regisztráció
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Utolsó módosítás
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(user.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Related Data */}
          {(user.owner || user.tenant || user.provider) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Owner Properties */}
              {user.owner && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Tulajdonos ingatlanok
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.owner.properties && user.owner.properties.length > 0 ? (
                      <div className="space-y-2">
                        {user.owner.properties.slice(0, 3).map((property) => (
                          <div key={property.id} className="text-sm">
                            <Link 
                              href={`/dashboard/properties/${property.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {property.street}, {property.city}
                            </Link>
                          </div>
                        ))}
                        {user.owner.properties.length > 3 && (
                          <div className="text-sm text-gray-500">
                            és {user.owner.properties.length - 3} további...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Nincs ingatlan</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tenant Properties */}
              {user.tenant && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Bérlő ingatlanok
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.tenant.properties && user.tenant.properties.length > 0 ? (
                      <div className="space-y-2">
                        {user.tenant.properties.slice(0, 3).map((property) => (
                          <div key={property.id} className="text-sm">
                            <Link 
                              href={`/dashboard/properties/${property.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {property.street}, {property.city}
                            </Link>
                          </div>
                        ))}
                        {user.tenant.properties.length > 3 && (
                          <div className="text-sm text-gray-500">
                            és {user.tenant.properties.length - 3} további...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Nincs ingatlan</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Provider Issues */}
              {user.provider && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Szolgáltató feladatok
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.provider.assignedIssues && user.provider.assignedIssues.length > 0 ? (
                      <div className="space-y-2">
                        {user.provider.assignedIssues.slice(0, 3).map((issue) => (
                          <div key={issue.id} className="text-sm">
                            <Link 
                              href={`/dashboard/issues/${issue.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {issue.title}
                            </Link>
                          </div>
                        ))}
                        {user.provider.assignedIssues.length > 3 && (
                          <div className="text-sm text-gray-500">
                            és {user.provider.assignedIssues.length - 3} további...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Nincs hozzárendelt feladat</div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="w-full lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle>Gyors műveletek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/dashboard/users/${user.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Felhasználó szerkesztése
                </Link>
              </Button>
              
              {user.role === 'OWNER' && user.owner && (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/owners/${user.owner.id}`}>
                    <Building className="mr-2 h-4 w-4" />
                    Tulajdonosi profil
                  </Link>
                </Button>
              )}
              
              {user.role === 'TENANT' && user.tenant && (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/tenants/${user.tenant.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    Bérlői profil
                  </Link>
                </Button>
              )}
              
              {user.role === 'PROVIDER' && user.provider && (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/dashboard/providers/${user.provider.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Szolgáltatói profil
                  </Link>
                </Button>
              )}

              <Button variant="outline" asChild className="w-full">
                <Link href={`mailto:${user.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email küldése
                </Link>
              </Button>

              {user.phone && (
                <Button variant="outline" asChild className="w-full">
                  <Link href={`tel:${user.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Telefonhívás
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}