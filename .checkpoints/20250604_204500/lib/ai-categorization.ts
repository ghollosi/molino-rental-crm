import { IssueCategory, IssuePriority } from '@prisma/client'

// AI kategorizálási típusok
export interface CategoryPrediction {
  category: IssueCategory
  confidence: number
  reasoning: string
}

export interface PriorityPrediction {
  priority: IssuePriority
  confidence: number
  reasoning: string
}

export interface IssueAnalysis {
  category: CategoryPrediction
  priority: PriorityPrediction
  suggestedTitle: string
  keyIssues: string[]
  estimatedDuration: number // órákban
  requiredSpecialists: string[]
}

// Kulcsszó alapú kategorizálás (egyszerű AI szimuláció)
const categoryKeywords: Record<IssueCategory, string[]> = {
  PLUMBING: [
    'víz', 'csap', 'lefolyó', 'wc', 'toalett', 'cső', 'szivárgás', 'dugulás', 
    'csöpög', 'folyik', 'vécé', 'mosdó', 'zuhanyzó', 'fürdő', 'kád', 'szelep',
    'water', 'tap', 'drain', 'pipe', 'leak', 'toilet', 'bathroom', 'shower'
  ],
  ELECTRICAL: [
    'villany', 'áram', 'kapcsoló', 'lámpa', 'konnekt', 'biztosíték', 'vezeték',
    'világítás', 'elektromos', 'rövidzárlat', 'megszakító', 'káble', 'izzó', 'világít',
    'nem világít', 'kiégett', 'égő', 'fény', 'sötét', 'áramszünet', 'kontakt',
    'electric', 'power', 'switch', 'light', 'socket', 'fuse', 'wire', 'cable'
  ],
  HVAC: [
    'fűtés', 'hűtés', 'klíma', 'légkondi', 'radiátor', 'kazán', 'termosztát',
    'hőmérséklet', 'meleg', 'hideg', 'szellőzés', 'ventilátor', 'konvektor',
    'heating', 'cooling', 'air', 'temperature', 'thermostat', 'radiator', 'boiler'
  ],
  STRUCTURAL: [
    'fal', 'tető', 'ablak', 'ajtó', 'padló', 'mennyezet', 'repedés', 'törés',
    'omlik', 'beázik', 'penész', 'nedves', 'szigetelés', 'vakolat', 'festés',
    'wall', 'roof', 'window', 'door', 'floor', 'ceiling', 'crack', 'break'
  ],
  OTHER: []
}

// Sürgősségi kulcsszavak
const urgencyKeywords = {
  URGENT: [
    'sürgős', 'azonnal', 'vészhelyzet', 'vész', 'kritikus', 'azonnali',
    'elárasztás', 'tűz', 'veszélyes', 'életveszély', 'katasztrófa',
    'urgent', 'emergency', 'immediate', 'critical', 'danger', 'flood'
  ],
  HIGH: [
    'fontos', 'gyorsan', 'probléma', 'komoly', 'nagy', 'gond', 'baj',
    'minél', 'hamarabb', 'holnap', 'ma', 'nem működik', 'elromlott',
    'important', 'quick', 'problem', 'serious', 'broken', 'not working'
  ],
  MEDIUM: [
    'kellene', 'jó lenne', 'zavaró', 'kényelmetlen', 'néha', 'időnként',
    'should', 'would be', 'annoying', 'sometimes', 'uncomfortable'
  ],
  LOW: [
    'ráér', 'később', 'kis', 'apró', 'esztétikai', 'szépség', 'nem sürgős',
    'later', 'small', 'minor', 'aesthetic', 'cosmetic', 'not urgent'
  ]
}

// AI-alapú kategorizálás (valójában fejlett kulcsszó elemzés)
export async function analyzeIssueWithAI(
  description: string,
  images?: string[]
): Promise<IssueAnalysis> {
  const lowerDesc = description.toLowerCase()
  
  // Kategória meghatározás
  const category = determineCategory(lowerDesc)
  
  // Prioritás meghatározás
  const priority = determinePriority(lowerDesc)
  
  // Javasolt cím generálás
  const suggestedTitle = generateTitle(lowerDesc, category.category)
  
  // Kulcs problémák azonosítása
  const keyIssues = identifyKeyIssues(lowerDesc, category.category)
  
  // Becsült időtartam
  const estimatedDuration = estimateDuration(category.category, priority.priority)
  
  // Szükséges szakemberek
  const requiredSpecialists = determineSpecialists(category.category)
  
  // Ha vannak képek, azokat is elemezhetjük (mock)
  if (images && images.length > 0) {
    // Itt lenne a képelemzés logika
    // Például: víz látható → PLUMBING, magas confidence
  }
  
  return {
    category,
    priority,
    suggestedTitle,
    keyIssues,
    estimatedDuration,
    requiredSpecialists
  }
}

// Kategória meghatározás
function determineCategory(description: string): CategoryPrediction {
  let bestCategory: IssueCategory = 'OTHER'
  let maxScore = 0
  let reasoning = ''
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'OTHER') continue
    
    const score = keywords.filter(keyword => 
      description.includes(keyword)
    ).length
    
    if (score > maxScore) {
      maxScore = score
      bestCategory = category as IssueCategory
      reasoning = `Talált kulcsszavak: ${keywords.filter(k => description.includes(k)).join(', ')}`
    }
  }
  
  const confidence = maxScore > 0 ? Math.min(maxScore * 20, 95) : 20
  
  if (maxScore === 0) {
    reasoning = 'Nem található specifikus kategória kulcsszó'
  }
  
  return {
    category: bestCategory,
    confidence,
    reasoning
  }
}

// Prioritás meghatározás
function determinePriority(description: string): PriorityPrediction {
  for (const [priority, keywords] of Object.entries(urgencyKeywords)) {
    const found = keywords.filter(keyword => 
      description.includes(keyword)
    )
    
    if (found.length > 0) {
      return {
        priority: priority as IssuePriority,
        confidence: Math.min(found.length * 25, 90),
        reasoning: `Sürgősségi kulcsszavak: ${found.join(', ')}`
      }
    }
  }
  
  return {
    priority: 'MEDIUM',
    confidence: 50,
    reasoning: 'Nem található specifikus sürgősségi jelző'
  }
}

// Cím generálás
function generateTitle(description: string, category: IssueCategory): string {
  const categoryNames: Record<IssueCategory, string> = {
    PLUMBING: 'Vízvezeték',
    ELECTRICAL: 'Elektromos',
    HVAC: 'Fűtés/Hűtés',
    STRUCTURAL: 'Szerkezeti',
    OTHER: 'Általános'
  }
  
  // Első mondat vagy első 50 karakter
  const firstSentence = description.split(/[.!?]/)[0].trim()
  const shortDesc = firstSentence.length > 50 
    ? firstSentence.substring(0, 47) + '...'
    : firstSentence
  
  return `${categoryNames[category]} - ${shortDesc}`
}

// Kulcs problémák azonosítása
function identifyKeyIssues(description: string, category: IssueCategory): string[] {
  const issues: string[] = []
  
  // Általános problémák
  if (description.includes('szivárog') || description.includes('folyik')) {
    issues.push('Szivárgás észlelhető')
  }
  if (description.includes('nem működik') || description.includes('elromlott')) {
    issues.push('Működési hiba')
  }
  if (description.includes('zaj') || description.includes('hang')) {
    issues.push('Szokatlan hangok')
  }
  if (description.includes('szag') || description.includes('bűz')) {
    issues.push('Kellemetlen szag')
  }
  
  // Kategória specifikus
  switch (category) {
    case 'PLUMBING':
      if (description.includes('dugul')) issues.push('Dugulás')
      if (description.includes('csöpög')) issues.push('Csöpögés')
      break
    case 'ELECTRICAL':
      if (description.includes('villog')) issues.push('Villogás')
      if (description.includes('szikrázik')) issues.push('Szikrázás - VESZÉLYES!')
      break
    case 'HVAC':
      if (description.includes('hideg')) issues.push('Nem fűt megfelelően')
      if (description.includes('meleg')) issues.push('Túlmelegedés')
      break
    case 'STRUCTURAL':
      if (description.includes('repedés')) issues.push('Repedések')
      if (description.includes('nedves')) issues.push('Nedvesség')
      break
  }
  
  return issues.length > 0 ? issues : ['Általános karbantartás szükséges']
}

// Időtartam becslés
function estimateDuration(category: IssueCategory, priority: IssuePriority): number {
  const baseDuration: Record<IssueCategory, number> = {
    PLUMBING: 3,
    ELECTRICAL: 2,
    HVAC: 4,
    STRUCTURAL: 6,
    OTHER: 2
  }
  
  const priorityMultiplier: Record<IssuePriority, number> = {
    URGENT: 1.5,
    HIGH: 1.2,
    MEDIUM: 1.0,
    LOW: 0.8
  }
  
  return Math.round(baseDuration[category] * priorityMultiplier[priority])
}

// Szakember meghatározás
function determineSpecialists(category: IssueCategory): string[] {
  const specialists: Record<IssueCategory, string[]> = {
    PLUMBING: ['Vízvezeték szerelő', 'Duguláselhárító'],
    ELECTRICAL: ['Villanyszerelő', 'Elektromos szakember'],
    HVAC: ['Klímaszerelő', 'Fűtésszerelő', 'Hűtéstechnikus'],
    STRUCTURAL: ['Kőműves', 'Ács', 'Festő-mázoló'],
    OTHER: ['Általános karbantartó', 'Házfelügyelő']
  }
  
  return specialists[category]
}

// Prediktív karbantartás ajánlások
export function generateMaintenanceRecommendations(
  propertyAge: number,
  lastMaintenances: Array<{ category: IssueCategory; date: Date }>,
  seasonMonth: number
): Array<{
  category: IssueCategory
  recommendation: string
  urgency: 'preventive' | 'recommended' | 'overdue'
  estimatedCost: number
}> {
  const recommendations: Array<any> = []
  const now = new Date()
  
  // Szezonális javaslatok
  if ([11, 12, 1, 2].includes(seasonMonth)) {
    // Tél
    recommendations.push({
      category: 'HVAC',
      recommendation: 'Fűtési rendszer ellenőrzése és karbantartása',
      urgency: 'recommended',
      estimatedCost: 25000
    })
    
    recommendations.push({
      category: 'PLUMBING',
      recommendation: 'Vízvezetékek fagyvédelmi ellenőrzése',
      urgency: 'preventive',
      estimatedCost: 15000
    })
  }
  
  if ([5, 6, 7, 8].includes(seasonMonth)) {
    // Nyár
    recommendations.push({
      category: 'HVAC',
      recommendation: 'Klímaberendezés tisztítása és szűrőcsere',
      urgency: 'recommended',
      estimatedCost: 20000
    })
  }
  
  // Kor alapú javaslatok
  if (propertyAge > 10) {
    recommendations.push({
      category: 'ELECTRICAL',
      recommendation: 'Elektromos hálózat felülvizsgálata',
      urgency: propertyAge > 20 ? 'overdue' : 'preventive',
      estimatedCost: 50000
    })
  }
  
  // Utolsó karbantartás alapú javaslatok
  const categoryMaintenanceInterval = {
    PLUMBING: 365, // 1 év
    ELECTRICAL: 730, // 2 év
    HVAC: 180, // 6 hónap
    STRUCTURAL: 1095, // 3 év
    OTHER: 365
  }
  
  for (const [category, days] of Object.entries(categoryMaintenanceInterval)) {
    const lastMaintenance = lastMaintenances.find(m => m.category === category as IssueCategory)
    
    if (!lastMaintenance || 
        (now.getTime() - lastMaintenance.date.getTime()) / (1000 * 60 * 60 * 24) > days) {
      recommendations.push({
        category: category as IssueCategory,
        recommendation: `${category} rendszer időszakos felülvizsgálata esedékes`,
        urgency: 'overdue',
        estimatedCost: 30000
      })
    }
  }
  
  return recommendations
}