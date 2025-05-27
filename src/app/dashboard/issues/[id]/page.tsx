'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, MapPin, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

const statusColors = {
  OPEN: 'bg-red-500',
  ASSIGNED: 'bg-yellow-500', 
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  CLOSED: 'bg-gray-500'
}

const statusLabels = {
  OPEN: 'Nyitott',
  ASSIGNED: 'Hozzárendelve',
  IN_PROGRESS: 'Folyamatban', 
  COMPLETED: 'Elvégezve',
  CLOSED: 'Lezárva'
}

const priorityColors = {
  LOW: 'bg-gray-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-red-500',
  URGENT: 'bg-purple-500'
}

const priorityLabels = {
  LOW: 'Alacsony',
  MEDIUM: 'Közepes',
  HIGH: 'Magas', 
  URGENT: 'Sürgős'
}

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const issueId = params.id as string
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')

  const { data: issue, isLoading, error, refetch } = api.issue.getById.useQuery(issueId)

  const updateStatus = api.issue.updateStatus.useMutation({
    onSuccess: () => {
      setUpdateSuccess('Állapot sikeresen frissítve')
      setUpdateError('')
      refetch()
      setTimeout(() => setUpdateSuccess(''), 3000)
    },
    onError: (error) => {
      setUpdateError(error.message)
    },
  })

  const deleteIssue = api.issue.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/issues')
    },
  })

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id: issueId, status: newStatus as 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' })
  }

  const handleDelete = async () => {
    if (confirm('Biztosan törölni szeretné ezt a hibabejelentést? Ez a művelet nem visszavonható.')) {
      await deleteIssue.mutateAsync(issueId)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Hibabejelentés nem található'}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/issues')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza a listához
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/issues')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{issue.title}</h1>
            <p className="text-gray-500">#{issue.ticketNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={statusColors[issue.status as keyof typeof statusColors]}>
            {statusLabels[issue.status as keyof typeof statusLabels]}
          </Badge>
          <Badge className={priorityColors[issue.priority as keyof typeof priorityColors]}>
            {priorityLabels[issue.priority as keyof typeof priorityLabels]}
          </Badge>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            Törlés
          </Button>
          <Button onClick={() => router.push(`/dashboard/issues/${issueId}/edit`)}>
            Szerkesztés
          </Button>
        </div>
      </div>

      {updateError && (
        <Alert variant="destructive">
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}

      {updateSuccess && (
        <Alert>
          <AlertDescription>{updateSuccess}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Hiba részletei</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Bejelentő</p>
                <p className="font-medium">{issue.reportedBy.name}</p>
                <p className="text-sm text-gray-500">{issue.reportedBy.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Állapot</p>
                <Select value={issue.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Nyitott</SelectItem>
                    <SelectItem value="ASSIGNED">Hozzárendelve</SelectItem>
                    <SelectItem value="IN_PROGRESS">Folyamatban</SelectItem>
                    <SelectItem value="COMPLETED">Elvégezve</SelectItem>
                    <SelectItem value="CLOSED">Lezárva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Ingatlan
                </p>
                <p className="font-medium">{issue.property.street}</p>
                <p className="text-sm text-gray-500">{issue.property.city}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Bejelentés dátuma
                </p>
                <p className="font-medium">
                  {new Date(issue.createdAt).toLocaleDateString('hu-HU')}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Leírás</p>
              <p className="text-sm">{issue.description}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Kategória</p>
              <p className="font-medium">{issue.category}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Összesítő</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {issue.status === 'COMPLETED' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm">
                {issue.status === 'COMPLETED' ? 'Megoldva' : 'Folyamatban'}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Létrehozva</p>
              <p className="text-sm">
                {new Date(issue.createdAt).toLocaleDateString('hu-HU')}
              </p>
            </div>
            {issue.updatedAt !== issue.createdAt && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Utoljára frissítve</p>
                <p className="text-sm">
                  {new Date(issue.updatedAt).toLocaleDateString('hu-HU')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}