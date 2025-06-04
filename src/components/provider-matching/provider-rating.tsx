'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/trpc/client'
import { Star, StarIcon, TrendingUp, Award, MessageSquare, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { toast } from 'sonner'

interface RatingFormData {
  providerId: string
  propertyId: string
  issueId: string
  rating: number
  quality: number
  timeliness: number
  communication: number
  price: number
  comment: string
}

export function ProviderRating() {
  const [formData, setFormData] = useState<RatingFormData>({
    providerId: '',
    propertyId: '',
    issueId: '',
    rating: 5,
    quality: 5,
    timeliness: 5,
    communication: 5,
    price: 5,
    comment: ''
  })

  const [selectedProviderId, setSelectedProviderId] = useState('')

  // API calls
  const rateProvider = api.providerMatching.rateProvider.useMutation({
    onSuccess: () => {
      toast.success('Értékelés sikeresen elmentve!')
      setFormData({
        providerId: '',
        propertyId: '',
        issueId: '',
        rating: 5,
        quality: 5,
        timeliness: 5,
        communication: 5,
        price: 5,
        comment: ''
      })
      refetchRatings()
    },
    onError: (error) => {
      toast.error('Hiba történt az értékelés mentése során')
      console.error('Rating error:', error)
    }
  })

  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  const { data: providers } = api.provider.list.useQuery({
    page: 1,
    limit: 100
  })

  const { data: issues } = api.issue.list.useQuery({
    page: 1,
    limit: 100,
    status: 'CLOSED'
  })

  const { data: ratings, refetch: refetchRatings } = api.providerRating.list.useQuery({
    providerId: selectedProviderId || undefined
  })

  const { data: providerStats } = api.providerRating.getStats.useQuery({
    providerId: selectedProviderId || undefined
  }, {
    enabled: !!selectedProviderId
  })

  const handleSubmitRating = async () => {
    if (!formData.providerId || !formData.propertyId || !formData.rating) {
      toast.error('Kérjük töltse ki a kötelező mezőket')
      return
    }

    try {
      await rateProvider.mutateAsync({
        providerId: formData.providerId,
        propertyId: formData.propertyId,
        issueId: formData.issueId || undefined,
        rating: formData.rating,
        quality: formData.quality,
        timeliness: formData.timeliness,
        communication: formData.communication,
        price: formData.price,
        comment: formData.comment
      })
    } catch (error) {
      console.error('Submit rating error:', error)
    }
  }

  const renderStarRating = (rating: number, onRatingChange?: (rating: number) => void, readOnly = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onRatingChange?.(star)}
            disabled={readOnly}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Új értékelés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Új Szolgáltató Értékelés
          </CardTitle>
          <CardDescription>
            Értékelje a szolgáltató munkáját részletes szempontok szerint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alapadatok */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="provider">Szolgáltató *</Label>
              <Select value={formData.providerId} onValueChange={(value) => setFormData(prev => ({ ...prev, providerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon szolgáltatót" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.items.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.businessName || provider.representativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="property">Ingatlan *</Label>
              <Select value={formData.propertyId} onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon ingatlant" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.items.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.street}, {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="issue">Hibabejelentés (opcionális)</Label>
              <Select value={formData.issueId} onValueChange={(value) => setFormData(prev => ({ ...prev, issueId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon hibabejelentést" />
                </SelectTrigger>
                <SelectContent>
                  {issues?.items.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.title} - {format(new Date(issue.createdAt), 'yyyy.MM.dd', { locale: hu })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Értékelési szempontok */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Értékelési szempontok</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Összesített értékelés *</Label>
                  {renderStarRating(formData.rating, (rating) => setFormData(prev => ({ ...prev, rating })))}
                </div>

                <div>
                  <Label>Munka minősége</Label>
                  {renderStarRating(formData.quality, (quality) => setFormData(prev => ({ ...prev, quality })))}
                </div>

                <div>
                  <Label>Időben való teljesítés</Label>
                  {renderStarRating(formData.timeliness, (timeliness) => setFormData(prev => ({ ...prev, timeliness })))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Kommunikáció</Label>
                  {renderStarRating(formData.communication, (communication) => setFormData(prev => ({ ...prev, communication })))}
                </div>

                <div>
                  <Label>Ár-érték arány</Label>
                  {renderStarRating(formData.price, (price) => setFormData(prev => ({ ...prev, price })))}
                </div>
              </div>
            </div>
          </div>

          {/* Megjegyzés */}
          <div>
            <Label htmlFor="comment">Részletes megjegyzés</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Írja le részletesen a tapasztalatait a szolgáltatóval..."
              rows={4}
            />
          </div>

          {/* Mentés gomb */}
          <Button 
            onClick={handleSubmitRating}
            disabled={rateProvider.isLoading}
            className="w-full"
          >
            {rateProvider.isLoading ? 'Mentés...' : 'Értékelés elküldése'}
          </Button>
        </CardContent>
      </Card>

      {/* Szolgáltató kiválasztása a statisztikákhoz */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Szolgáltató Teljesítmény Elemzés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Szolgáltató kiválasztása</Label>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Válasszon szolgáltatót az elemzéshez" />
              </SelectTrigger>
              <SelectContent>
                {providers?.items.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.businessName || provider.representativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Szolgáltató statisztikák */}
          {selectedProviderId && providerStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{providerStats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Átlagos értékelés</div>
                {renderStarRating(providerStats.averageRating, undefined, true)}
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{providerStats.totalRatings}</div>
                <div className="text-sm text-gray-600">Összes értékelés</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{providerStats.completedJobs}</div>
                <div className="text-sm text-gray-600">Befejezett munkák</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{providerStats.averageResponseTime}h</div>
                <div className="text-sm text-gray-600">Átlagos válaszidő</div>
              </div>
            </div>
          )}

          {/* Részletes értékelések */}
          {selectedProviderId && ratings && ratings.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Legújabb értékelések</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dátum</TableHead>
                    <TableHead>Ingatlan</TableHead>
                    <TableHead>Értékelés</TableHead>
                    <TableHead>Részletek</TableHead>
                    <TableHead>Megjegyzés</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.slice(0, 10).map((rating) => (
                    <TableRow key={rating.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {format(new Date(rating.createdAt), 'yyyy.MM.dd', { locale: hu })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{rating.property.street}</div>
                        <div className="text-sm text-gray-600">{rating.property.city}</div>
                      </TableCell>
                      <TableCell>
                        {renderStarRating(rating.rating, undefined, true)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div>Minőség: {renderStarRating(rating.quality || 0, undefined, true)}</div>
                          <div>Időbeni teljesítés: {renderStarRating(rating.timeliness || 0, undefined, true)}</div>
                          <div>Kommunikáció: {renderStarRating(rating.communication || 0, undefined, true)}</div>
                          <div>Ár-érték: {renderStarRating(rating.price || 0, undefined, true)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rating.comment && (
                          <div className="max-w-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <MessageSquare className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-600">Megjegyzés:</span>
                            </div>
                            <div className="text-sm truncate" title={rating.comment}>
                              {rating.comment}
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedProviderId && (!ratings || ratings.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Még nincsenek értékelések ehhez a szolgáltatóhoz</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}