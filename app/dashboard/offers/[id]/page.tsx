'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ArrowLeft, 
  Mail, 
  Calendar,
  AlertCircle,
  Trash2,
  Edit,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Building,
  User,
  Download,
  Printer
} from 'lucide-react'
import Link from 'next/link'
import { usePDFExport } from '@/src/hooks/use-pdf-export'

export default function OfferDetailPage() {
  const params = useParams()
  const router = useRouter()
  const offerId = params.id as string
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const { data: offer, isLoading, refetch } = api.offer.getById.useQuery(offerId)
  const { exportHTML, isExporting, error: exportError } = usePDFExport()

  const deleteOffer = api.offer.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/offers')
    },
    onError: (error) => {
      setDeleteError(error.message)
    },
  })

  const updateStatus = api.offer.updateStatus.useMutation({
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      setStatusError(error.message)
    },
  })

  const handleDelete = async () => {
    if (confirm('Biztosan törölni szeretné ezt az ajánlatot? Ez a művelet nem visszavonható.')) {
      await deleteOffer.mutateAsync(offerId)
    }
  }

  const handleSend = async () => {
    await updateStatus.mutateAsync({
      id: offerId,
      status: 'SENT',
    })
  }

  const handleAccept = async () => {
    await updateStatus.mutateAsync({
      id: offerId,
      status: 'ACCEPTED',
    })
  }

  const handleReject = async () => {
    if (confirm('Biztosan elutasítja ezt az ajánlatot?')) {
      await updateStatus.mutateAsync({
        id: offerId,
        status: 'REJECTED',
      })
    }
  }

  const handleExportPDF = async () => {
    await exportHTML({
      type: 'offer',
      id: offerId
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary'
      case 'SENT':
        return 'default'
      case 'ACCEPTED':
        return 'secondary'
      case 'REJECTED':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-5 w-5" />
      case 'SENT':
        return <Send className="h-5 w-5" />
      case 'ACCEPTED':
        return <CheckCircle className="h-5 w-5" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5" />
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Az ajánlat nem található.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/offers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
        <div className="flex gap-2">
          {offer.status === 'DRAFT' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/offers/${offer.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Szerkesztés
                </Link>
              </Button>
              <Button 
                onClick={handleSend}
                disabled={updateStatus.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Elküldés
              </Button>
            </>
          )}
          {offer.status === 'SENT' && (
            <>
              <Button 
                variant="outline"
                onClick={handleAccept}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Elfogadás
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={updateStatus.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Elutasítás
              </Button>
            </>
          )}
          <Button 
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            <Printer className="mr-2 h-4 w-4" />
            {isExporting ? 'Exportálás...' : 'PDF Export'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteOffer.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Törlés
          </Button>
        </div>
      </div>

      {(deleteError || statusError || exportError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deleteError || statusError || exportError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Ajánlat #{offer.id.slice(-6)}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusIcon(offer.status)}
                    <Badge variant={getStatusColor(offer.status)}>
                      {offer.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(offer.totalAmount))}
                  </p>
                  <p className="text-sm text-gray-500">
                    Érvényes: {new Date(offer.validUntil).toLocaleDateString('hu-HU')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {offer.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Megjegyzések</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{offer.notes}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Tételek</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Megnevezés</TableHead>
                      <TableHead className="text-right">Mennyiség</TableHead>
                      <TableHead className="text-right">Egységár</TableHead>
                      <TableHead className="text-right">Összeg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(offer.items as Array<{description: string; quantity: number; unitPrice: number; total: number}>).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-semibold">
                        Összesen:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(Number(offer.totalAmount))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {offer.issue && (
            <Card>
              <CardHeader>
                <CardTitle>Kapcsolódó hibabejelentés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <Link 
                        href={`/dashboard/issues/${offer.issue.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {offer.issue.title}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Státusz: {offer.issue.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Building className="mr-2 h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <Link 
                        href={`/dashboard/properties/${offer.property.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {offer.property.street}, {offer.property.city}
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Ajánlatot készítette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-400" />
                  <span>{offer.createdBy.name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-gray-400" />
                  <a href={`mailto:${offer.createdBy.email}`} className="text-blue-600 hover:underline">
                    {offer.createdBy.email}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Időpontok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                <span>Létrehozva: {new Date(offer.createdAt).toLocaleString('hu-HU')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Műveletek</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                PDF letöltése
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}