'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Phone,
  Mail
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'

interface ProviderSuggestionsProps {
  propertyId: string
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'OTHER'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  onProviderSelected?: (providerId: string) => void
}

export function ProviderSuggestions({ 
  propertyId, 
  category, 
  priority, 
  onProviderSelected 
}: ProviderSuggestionsProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)

  // Legjobb szolgáltatók lekérése
  const { data: suggestions, isLoading, refetch } = api.providerMatching.findBestProviders.useQuery({
    propertyId,
    category,
    priority
  })

  // Automatikus hozzárendelés mutation
  const autoAssignMutation = api.providerMatching.autoAssignProvider.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        if (result.providerId && onProviderSelected) {
          onProviderSelected(result.providerId)
        }
        refetch()
      } else {
        toast.warning(result.message)
      }
    },
    onError: (error) => {
      toast.error('Hiba történt az automatikus hozzárendelés során')
      console.error('Auto assign error:', error)
    }
  })

  const handleSelectProvider = (providerId: string) => {
    setSelectedProviderId(providerId)
    if (onProviderSelected) {
      onProviderSelected(providerId)
    }
    toast.success('Szolgáltató kiválasztva')
  }

  const handleAutoAssign = (issueId: string) => {
    autoAssignMutation.mutate({ issueId })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Szolgáltató javaslatok</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Szolgáltató javaslatok</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nem találhatók megfelelő szolgáltatók ehhez a kategóriához és prioritáshoz.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const getBadgeVariant = (score: number) => {
    if (score >= 80) return 'default' // Kiváló
    if (score >= 60) return 'secondary' // Jó
    if (score >= 40) return 'outline' // Elfogadható
    return 'destructive' // Gyenge
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Kiváló'
    if (score >= 60) return 'Jó'
    if (score >= 40) return 'Elfogadható'
    return 'Gyenge'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Szolgáltató javaslatok</span>
          <Badge variant="outline">{category}</Badge>
          <Badge variant={priority === 'URGENT' ? 'destructive' : 'secondary'}>
            {priority}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.providerId}
            className={`p-4 border rounded-lg transition-colors hover:bg-gray-50 ${
              selectedProviderId === suggestion.providerId ? 'border-blue-500 bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    {index === 0 && (
                      <Zap className="h-4 w-4 text-yellow-500" title="Legjobb választás" />
                    )}
                    <span className="font-medium text-lg">
                      {suggestion.provider?.businessName}
                    </span>
                  </div>
                  <Badge variant={getBadgeVariant(suggestion.score)}>
                    {suggestion.score} pont - {getScoreLabel(suggestion.score)}
                  </Badge>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  {suggestion.provider?.user.firstName && (
                    <span>{suggestion.provider.user.firstName} {suggestion.provider.user.lastName}</span>
                  )}
                  {suggestion.provider?.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{suggestion.provider.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {suggestion.provider?.responseTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{suggestion.provider.responseTime}h válaszidő</span>
                    </div>
                  )}
                </div>

                {/* Kapcsolat adatok */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  {suggestion.provider?.user.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{suggestion.provider.user.phone}</span>
                    </div>
                  )}
                  {suggestion.provider?.user.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{suggestion.provider.user.email}</span>
                    </div>
                  )}
                </div>

                {/* Indoklás */}
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">Miért ajánljuk:</span>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.reasons.slice(0, 3).map((reason, reasonIndex) => (
                      <Badge key={reasonIndex} variant="outline" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                    {suggestion.reasons.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{suggestion.reasons.length - 3} további
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  onClick={() => handleSelectProvider(suggestion.providerId)}
                  variant={selectedProviderId === suggestion.providerId ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Kiválaszt</span>
                </Button>
                
                {index === 0 && suggestion.score >= 50 && (
                  <Badge variant="secondary" className="text-center">
                    Automatikus hozzárendelésre alkalmas
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Automatikus hozzárendelés info */}
        {suggestions.length > 0 && suggestions[0].score >= 50 && (
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              A legjobb szolgáltató pontszáma elég magas az automatikus hozzárendeléshez. 
              A rendszer automatikusan hozzárendelheti a hibabejelentéshez.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}