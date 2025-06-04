/**
 * @file Issue Workflow Service
 * @description Automatizált workflow kezelés hibabejelentésekhez
 * @created 2025-05-28
 */

import { IssueStatus, IssuePriority, UserRole } from '@prisma/client'
import { db } from '@/lib/db'
import { sendIssueNotification } from '@/lib/email'

export interface WorkflowAction {
  type: 'status_change' | 'assignment' | 'escalation' | 'notification'
  from?: IssueStatus
  to: IssueStatus
  condition?: WorkflowCondition
  notify?: string[]
  delay?: number // óra
}

export interface WorkflowCondition {
  priority?: IssuePriority[]
  hasPhotos?: boolean
  hoursOpen?: number
  assignedTo?: string | null
}

export interface WorkflowRule {
  id: string
  name: string
  description: string
  trigger: 'created' | 'assigned' | 'photo_added' | 'time_based' | 'manual'
  conditions: WorkflowCondition
  actions: WorkflowAction[]
  enabled: boolean
}

// Előre definiált workflow szabályok
export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: 'auto_assign_urgent',
    name: 'Sürgős hibák automatikus hozzárendelése',
    description: 'Sürgős prioritású hibák automatikusan IN_PROGRESS státuszra kerülnek',
    trigger: 'created',
    conditions: {
      priority: ['URGENT']
    },
    actions: [
      {
        type: 'status_change',
        from: 'OPEN',
        to: 'IN_PROGRESS',
        notify: ['owner', 'admin']
      }
    ],
    enabled: true
  },
  {
    id: 'escalate_high_priority',
    name: 'Magas prioritású hibák eszkalációja',
    description: 'Magas prioritású hibák 4 óra után eszkalálódnak',
    trigger: 'time_based',
    conditions: {
      priority: ['HIGH'],
      hoursOpen: 4
    },
    actions: [
      {
        type: 'escalation',
        from: 'OPEN',
        to: 'IN_PROGRESS',
        notify: ['admin', 'manager']
      }
    ],
    enabled: true
  },
  {
    id: 'close_completed_tasks',
    name: 'Befejezett feladatok automatikus lezárása',
    description: 'COMPLETED státuszú hibák 24 óra után automatikusan CLOSED-ra kerülnek',
    trigger: 'time_based',
    conditions: {
      hoursOpen: 24
    },
    actions: [
      {
        type: 'status_change',
        from: 'COMPLETED',
        to: 'CLOSED',
        notify: ['owner']
      }
    ],
    enabled: true
  },
  {
    id: 'assign_with_photos',
    name: 'Képes hibák gyorsabb feldolgozása',
    description: 'Ha kép van csatolva, a hiba ASSIGNED státuszra kerül',
    trigger: 'photo_added',
    conditions: {
      hasPhotos: true
    },
    actions: [
      {
        type: 'status_change',
        from: 'OPEN',
        to: 'ASSIGNED',
        notify: ['provider']
      }
    ],
    enabled: true
  }
]

/**
 * Workflow szabály végrehajtása
 */
export class WorkflowEngine {
  
  /**
   * Hibabejelentés létrehozásakor futó workflow
   */
  static async onIssueCreated(issueId: string): Promise<void> {
    console.log(`🔄 Workflow trigger: Issue created - ${issueId}`)
    
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        property: {
          include: {
            owner: { include: { user: true } }
          }
        },
        reportedBy: true,
        assignedTo: { include: { user: true } }
      }
    })

    if (!issue) {
      console.error('❌ Issue not found for workflow')
      return
    }

    const applicableRules = DEFAULT_WORKFLOW_RULES.filter(rule => 
      rule.enabled && 
      rule.trigger === 'created' &&
      this.checkConditions(rule.conditions, issue)
    )

    for (const rule of applicableRules) {
      await this.executeActions(rule.actions, issue)
    }
  }

  /**
   * Hibabejelentés hozzárendelésekor futó workflow
   */
  static async onIssueAssigned(issueId: string, providerId: string): Promise<void> {
    console.log(`🔄 Workflow trigger: Issue assigned - ${issueId} to ${providerId}`)
    
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        property: {
          include: {
            owner: { include: { user: true } }
          }
        },
        reportedBy: true,
        assignedTo: { include: { user: true } }
      }
    })

    if (!issue) return

    // Automatikus státusz változtatás ASSIGNED-ra
    if (issue.status === 'OPEN') {
      await db.issue.update({
        where: { id: issueId },
        data: { 
          status: 'ASSIGNED',
          updatedAt: new Date()
        }
      })

      // Értesítés küldése
      await this.sendWorkflowNotification(issue, 'ASSIGNED', 'Hibabejelentés hozzárendelve')
    }
  }

  /**
   * Kép feltöltésekor futó workflow
   */
  static async onPhotoAdded(issueId: string, photos: string[]): Promise<void> {
    console.log(`🔄 Workflow trigger: Photo added - ${issueId}`)
    
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        property: {
          include: {
            owner: { include: { user: true } }
          }
        },
        reportedBy: true,
        assignedTo: { include: { user: true } }
      }
    })

    if (!issue) return

    const applicableRules = DEFAULT_WORKFLOW_RULES.filter(rule => 
      rule.enabled && 
      rule.trigger === 'photo_added' &&
      this.checkConditions(rule.conditions, issue)
    )

    for (const rule of applicableRules) {
      await this.executeActions(rule.actions, issue)
    }
  }

  /**
   * Időalapú workflow ellenőrzése (cron job-hoz)
   */
  static async checkTimeBasedRules(): Promise<void> {
    console.log('🕐 Checking time-based workflow rules...')
    
    const timeBasedRules = DEFAULT_WORKFLOW_RULES.filter(rule => 
      rule.enabled && rule.trigger === 'time_based'
    )

    for (const rule of timeBasedRules) {
      await this.processTimeBasedRule(rule)
    }
  }

  /**
   * Időalapú szabály feldolgozása
   */
  private static async processTimeBasedRule(rule: WorkflowRule): Promise<void> {
    const hoursAgo = new Date()
    hoursAgo.setHours(hoursAgo.getHours() - (rule.conditions.hoursOpen || 0))

    const whereClause: any = {
      createdAt: { lte: hoursAgo }
    }

    if (rule.conditions.priority) {
      whereClause.priority = { in: rule.conditions.priority }
    }

    // Eszkaláció szabályhoz
    if (rule.id === 'escalate_high_priority') {
      whereClause.status = 'OPEN'
    }

    // Automatikus lezárás szabályhoz
    if (rule.id === 'close_completed_tasks') {
      whereClause.status = 'COMPLETED'
      whereClause.updatedAt = { lte: hoursAgo }
    }

    const issues = await db.issue.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            owner: { include: { user: true } }
          }
        },
        reportedBy: true,
        assignedTo: { include: { user: true } }
      }
    })

    console.log(`⏰ Found ${issues.length} issues matching rule: ${rule.name}`)

    for (const issue of issues) {
      await this.executeActions(rule.actions, issue)
    }
  }

  /**
   * Workflow feltételek ellenőrzése
   */
  private static checkConditions(conditions: WorkflowCondition, issue: any): boolean {
    if (conditions.priority && !conditions.priority.includes(issue.priority)) {
      return false
    }

    if (conditions.hasPhotos !== undefined) {
      const hasPhotos = issue.photos && issue.photos.length > 0
      if (conditions.hasPhotos !== hasPhotos) {
        return false
      }
    }

    if (conditions.assignedTo !== undefined) {
      if (conditions.assignedTo === null && issue.assignedToId !== null) {
        return false
      }
      if (conditions.assignedTo !== null && issue.assignedToId === null) {
        return false
      }
    }

    return true
  }

  /**
   * Workflow akciók végrehajtása
   */
  private static async executeActions(actions: WorkflowAction[], issue: any): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'status_change':
          await this.executeStatusChange(action, issue)
          break
        case 'escalation':
          await this.executeEscalation(action, issue)
          break
        case 'notification':
          await this.executeNotification(action, issue)
          break
      }
    }
  }

  /**
   * Státusz változtatás végrehajtása
   */
  private static async executeStatusChange(action: WorkflowAction, issue: any): Promise<void> {
    if (action.from && issue.status !== action.from) {
      return // Nem teljesül a feltétel
    }

    console.log(`🔄 Status change: ${issue.status} → ${action.to} for issue ${issue.id}`)

    await db.issue.update({
      where: { id: issue.id },
      data: { 
        status: action.to,
        updatedAt: new Date()
      }
    })

    await this.sendWorkflowNotification(issue, action.to, `Automatikus státusz változás: ${action.to}`)
  }

  /**
   * Eszkaláció végrehajtása
   */
  private static async executeEscalation(action: WorkflowAction, issue: any): Promise<void> {
    console.log(`⚠️ Escalating issue ${issue.id} - ${issue.priority} priority`)

    // Státusz frissítése
    await db.issue.update({
      where: { id: issue.id },
      data: { 
        status: action.to,
        priority: issue.priority === 'HIGH' ? 'URGENT' : issue.priority,
        updatedAt: new Date()
      }
    })

    // Eszkalációs értesítés
    await this.sendWorkflowNotification(
      issue, 
      action.to, 
      `⚠️ ESZKALÁCIÓ: ${issue.title} - ${issue.priority} prioritás`
    )
  }

  /**
   * Workflow értesítés küldése
   */
  private static async sendWorkflowNotification(
    issue: any, 
    newStatus: IssueStatus, 
    message: string
  ): Promise<void> {
    try {
      const emails: string[] = []

      // Tulajdonos
      if (issue.property?.owner?.user?.email) {
        emails.push(issue.property.owner.user.email)
      }

      // Hozzárendelt provider
      if (issue.assignedTo?.user?.email) {
        emails.push(issue.assignedTo.user.email)
      }

      // Admin-ok
      const admins = await db.user.findMany({
        where: {
          role: { in: ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'] }
        },
        select: { email: true }
      })
      emails.push(...admins.map(admin => admin.email))

      if (emails.length > 0) {
        await sendIssueNotification(emails, {
          issueId: issue.id,
          title: `${message}: ${issue.title}`,
          description: issue.description || '',
          priority: issue.priority,
          category: issue.category,
          propertyAddress: `${issue.property.street}, ${issue.property.city}`,
          reportedBy: issue.reportedBy?.name || 'Rendszer',
          status: newStatus
        })
      }
    } catch (error) {
      console.error('❌ Failed to send workflow notification:', error)
    }
  }

  /**
   * SLA követés és riportok
   */
  static async checkSLACompliance(): Promise<{
    slaBreaches: any[]
    upcomingDeadlines: any[]
    stats: any
  }> {
    console.log('📊 Checking SLA compliance...')
    
    // SLA határidők prioritás szerint (órában)
    const SLA_DEADLINES = {
      URGENT: 2,    // 2 óra
      HIGH: 8,      // 8 óra
      MEDIUM: 24,   // 24 óra
      LOW: 72       // 72 óra
    }

    const now = new Date()
    const slaBreaches: any[] = []
    const upcomingDeadlines: any[] = []

    for (const [priority, hours] of Object.entries(SLA_DEADLINES)) {
      const deadline = new Date()
      deadline.setHours(deadline.getHours() - hours)
      
      const upcomingDeadline = new Date()
      upcomingDeadline.setHours(upcomingDeadline.getHours() - (hours * 0.8)) // 80%-nál figyelmeztetés

      // SLA átlépések
      const breachedIssues = await db.issue.findMany({
        where: {
          priority: priority as IssuePriority,
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
          createdAt: { lte: deadline }
        },
        include: {
          property: { select: { street: true, city: true } },
          assignedTo: { include: { user: { select: { name: true } } } }
        }
      })

      // Közelgő határidők
      const upcomingIssues = await db.issue.findMany({
        where: {
          priority: priority as IssuePriority,
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
          createdAt: { 
            lte: upcomingDeadline,
            gt: deadline 
          }
        },
        include: {
          property: { select: { street: true, city: true } },
          assignedTo: { include: { user: { select: { name: true } } } }
        }
      })

      slaBreaches.push(...breachedIssues.map(issue => ({
        ...issue,
        priority,
        hoursOverdue: Math.floor((now.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60)) - hours
      })))

      upcomingDeadlines.push(...upcomingIssues.map(issue => ({
        ...issue,
        priority,
        hoursRemaining: hours - Math.floor((now.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60))
      })))
    }

    // Statisztikák
    const stats = {
      totalBreaches: slaBreaches.length,
      upcomingCount: upcomingDeadlines.length,
      breachesByPriority: Object.fromEntries(
        Object.keys(SLA_DEADLINES).map(priority => [
          priority,
          slaBreaches.filter(b => b.priority === priority).length
        ])
      )
    }

    return { slaBreaches, upcomingDeadlines, stats }
  }

  /**
   * Workflow statisztikák lekérése
   */
  static async getWorkflowStats(): Promise<{
    rulesExecuted: number
    issuesProcessed: number
    avgResolutionTime: number
    slaCompliance: number
  }> {
    const completedIssues = await db.issue.findMany({
      where: {
        status: 'CLOSED',
        completedDate: { not: null }
      },
      select: {
        createdAt: true,
        completedDate: true,
        priority: true
      }
    })

    const totalIssues = await db.issue.count({
      where: {
        status: { in: ['COMPLETED', 'CLOSED'] }
      }
    })

    // Átlagos megoldási idő számítása
    let totalResolutionTime = 0
    let validIssues = 0

    for (const issue of completedIssues) {
      if (issue.completedDate) {
        const resolutionHours = (issue.completedDate.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60)
        totalResolutionTime += resolutionHours
        validIssues++
      }
    }

    const avgResolutionTime = validIssues > 0 ? totalResolutionTime / validIssues : 0

    // SLA megfelelőség számítása
    const slaCheck = await this.checkSLACompliance()
    const slaCompliance = totalIssues > 0 ? 
      ((totalIssues - slaCheck.stats.totalBreaches) / totalIssues) * 100 : 100

    return {
      rulesExecuted: 0, // TODO: Implementálni workflow végrehajtás számlálót
      issuesProcessed: totalIssues,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      slaCompliance: Math.round(slaCompliance * 10) / 10
    }
  }

  /**
   * Eszkaláció e-mail küldése vezetőknek
   */
  static async sendEscalationAlert(issue: any): Promise<void> {
    const managers = await db.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SERVICE_MANAGER'] }
      },
      select: { email: true, name: true }
    })

    const escalationMessage = `
      🚨 ESZKALÁCIÓ SZÜKSÉGES
      
      Hibabejelentés: ${issue.title}
      Ticket szám: ${issue.ticketNumber}
      Prioritás: ${issue.priority}
      Létrehozva: ${issue.createdAt.toLocaleString('hu-HU')}
      Ingatlan: ${issue.property.street}, ${issue.property.city}
      
      A hiba meghaladta az SLA határidőt és azonnali figyelmet igényel.
    `

    for (const manager of managers) {
      try {
        await sendIssueNotification([manager.email], {
          issueId: issue.id,
          title: `🚨 ESZKALÁCIÓ: ${issue.title}`,
          description: escalationMessage,
          priority: 'URGENT',
          category: issue.category,
          propertyAddress: `${issue.property.street}, ${issue.property.city}`,
          reportedBy: 'Automatikus Eszkaláció',
          status: issue.status
        })
      } catch (error) {
        console.error(`Failed to send escalation to ${manager.email}:`, error)
      }
    }
  }
}