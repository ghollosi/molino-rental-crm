'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { MoreHorizontal, Edit, Trash2, User, Building, Clock, Calendar, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assignment {
  id: string
  assignmentType: 'ONE_TIME' | 'RECURRING' | 'PERMANENT'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  description?: string
  notes?: string
  isPrimary: boolean
  categories: string[]
  startDate?: Date
  endDate?: Date
  isRecurring: boolean
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly'
    days?: number[]
    time?: string
    interval: number
  }
  recurringStartDate?: Date
  recurringEndDate?: Date
  isActive: boolean
  assignedAt: Date
  createdAt: Date
  updatedAt: Date
  
  // Relations
  provider?: {
    id: string
    businessName: string
    user: {
      firstName: string
      lastName: string
      email: string
      phone?: string
    }
  }
  property?: {
    id: string
    street: string
    city: string
    type: string
  }
}

interface AssignmentListProps {
  assignments: Assignment[]
  mode: 'property-view' | 'provider-view' | 'admin-view'
  loading?: boolean
  onEdit?: (assignment: Assignment) => void
  onDelete?: (assignmentId: string) => void
  onToggleActive?: (assignmentId: string, isActive: boolean) => void
}

const ASSIGNMENT_TYPE_LABELS = {
  ONE_TIME: 'Egyedi',
  RECURRING: 'Rendszeres', 
  PERMANENT: 'Állandó'
}

const PRIORITY_LABELS = {
  LOW: 'Alacsony',
  NORMAL: 'Normál',
  HIGH: 'Magas',
  URGENT: 'Sürgős'
}

const CATEGORY_LABELS = {
  PLUMBING: 'Vízvezeték',
  ELECTRICAL: 'Elektromos',
  HVAC: 'Fűtés/Klíma',
  STRUCTURAL: 'Építkezés',
  OTHER: 'Egyéb'
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

const TYPE_COLORS = {
  ONE_TIME: 'bg-green-100 text-green-800',
  RECURRING: 'bg-purple-100 text-purple-800',
  PERMANENT: 'bg-yellow-100 text-yellow-800'
}

export function AssignmentList({ 
  assignments, 
  mode, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: AssignmentListProps) {
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null)

  const formatRecurringPattern = (assignment: Assignment) => {
    if (!assignment.isRecurring || !assignment.recurringPattern) return null
    
    const { type, days, time, interval } = assignment.recurringPattern
    
    let pattern = `${interval > 1 ? `Minden ${interval}. ` : ''}`
    
    switch (type) {
      case 'daily':
        pattern += 'nap'
        break
      case 'weekly':
        pattern += 'hét'
        if (days && days.length > 0) {
          const dayNames = ['H', 'K', 'Sz', 'Cs', 'P', 'Szo', 'V']
          pattern += ` (${days.map(d => dayNames[d - 1]).join(', ')})`
        }
        break
      case 'monthly':
        pattern += 'hónap'
        break
    }
    
    if (time) {
      pattern += ` ${time}`
    }
    
    return pattern
  }

  const formatDateRange = (startDate?: Date, endDate?: Date) => {
    if (!startDate && !endDate) return null
    
    if (startDate && endDate) {
      return `${format(startDate, 'yyyy. MM. dd.', { locale: hu })} - ${format(endDate, 'yyyy. MM. dd.', { locale: hu })}`
    }
    
    if (startDate) {
      return `${format(startDate, 'yyyy. MM. dd.', { locale: hu })} -tól`
    }
    
    if (endDate) {
      return `- ${format(endDate, 'yyyy. MM. dd.', { locale: hu })}`
    }
    
    return null
  }

  const handleDelete = async (assignmentId: string) => {
    if (onDelete) {
      await onDelete(assignmentId)
    }
    setDeleteAssignmentId(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hozzárendelések</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Betöltés...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hozzárendelések</CardTitle>
          <CardDescription>
            {mode === 'property-view' && 'Nincsenek hozzárendelt szolgáltatók'}
            {mode === 'provider-view' && 'Nincsenek hozzárendelt ingatlanok'}
            {mode === 'admin-view' && 'Nincsenek hozzárendelések'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {mode === 'property-view' && 'Még nem rendelt hozzá szolgáltatókat ehhez az ingatlanhoz.'}
              {mode === 'provider-view' && 'Még nem rendelt hozzá ingatlanokat ehhez a szolgáltatóhoz.'}
              {mode === 'admin-view' && 'Még nincsenek hozzárendelések a rendszerben.'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Hozzárendelések ({assignments.length})
        </CardTitle>
        <CardDescription>
          {mode === 'property-view' && 'Az ingatlanhoz hozzárendelt szolgáltatók'}
          {mode === 'provider-view' && 'A szolgáltatóhoz hozzárendelt ingatlanok'}
          {mode === 'admin-view' && 'Összes hozzárendelés a rendszerben'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {mode !== 'provider-view' && <TableHead>Szolgáltató</TableHead>}
                {mode !== 'property-view' && <TableHead>Ingatlan</TableHead>}
                <TableHead>Típus</TableHead>
                <TableHead>Prioritás</TableHead>
                <TableHead>Kategóriák</TableHead>
                <TableHead>Időszak</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead className="w-[70px]">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  {/* Szolgáltató */}
                  {mode !== 'provider-view' && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{assignment.provider?.businessName}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.provider?.user.firstName} {assignment.provider?.user.lastName}
                          </div>
                          {assignment.isPrimary && (
                            <Badge variant="secondary" className="text-xs">Elsődleges</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  {/* Ingatlan */}
                  {mode !== 'property-view' && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{assignment.property?.street}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.property?.city}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  {/* Típus */}
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={TYPE_COLORS[assignment.assignmentType]}>
                        {ASSIGNMENT_TYPE_LABELS[assignment.assignmentType]}
                      </Badge>
                      {assignment.isRecurring && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatRecurringPattern(assignment)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Prioritás */}
                  <TableCell>
                    <Badge className={PRIORITY_COLORS[assignment.priority]}>
                      {PRIORITY_LABELS[assignment.priority]}
                    </Badge>
                  </TableCell>
                  
                  {/* Kategóriák */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {assignment.categories.slice(0, 2).map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                        </Badge>
                      ))}
                      {assignment.categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{assignment.categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Időszak */}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {formatDateRange(assignment.startDate, assignment.endDate) || 'Nincs megadva'}
                      </span>
                    </div>
                    {assignment.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {assignment.description}
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Státusz */}
                  <TableCell>
                    <Badge variant={assignment.isActive ? "default" : "secondary"}>
                      {assignment.isActive ? 'Aktív' : 'Inaktív'}
                    </Badge>
                  </TableCell>
                  
                  {/* Műveletek */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(assignment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Szerkesztés
                          </DropdownMenuItem>
                        )}
                        {onToggleActive && (
                          <DropdownMenuItem 
                            onClick={() => onToggleActive(assignment.id, !assignment.isActive)}
                          >
                            {assignment.isActive ? 'Deaktiválás' : 'Aktiválás'}
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Törlés
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hozzárendelés törlése</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Biztosan törli ezt a hozzárendelést? Ez a művelet nem vonható vissza.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Mégse</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(assignment.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Törlés
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}