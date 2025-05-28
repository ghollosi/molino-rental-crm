/**
 * @file Contract Template Service
 * @description Szerződés template kezelés és generálás
 * @created 2025-05-28
 */

import { db } from '@/lib/db'

export interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean'
  required: boolean
  defaultValue?: string | number | boolean
  description?: string
}

export interface ContractData {
  // Property data
  propertyAddress: string
  propertyCity: string
  propertyPostalCode: string
  propertyType: string
  propertySize?: number
  
  // Landlord data
  landlordName: string
  landlordEmail: string
  landlordPhone: string
  landlordAddress: string
  landlordTaxNumber?: string
  
  // Tenant data
  tenantName: string
  tenantEmail: string
  tenantPhone: string
  tenantAddress: string
  tenantIdNumber?: string
  
  // Contract terms
  startDate: string
  endDate: string
  rentAmount: number
  deposit: number
  paymentDay: number
  currency: string
  
  // Additional terms
  utilitiesIncluded: boolean
  petsAllowed: boolean
  smokingAllowed: boolean
  
  // Company data
  companyName: string
  companyAddress: string
  companyTaxNumber: string
  
  // Meta
  contractNumber: string
  generatedDate: string
}

/**
 * Default variables available in all contract templates
 */
export const DEFAULT_TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Property variables
  { key: 'propertyAddress', label: 'Ingatlan címe', type: 'text', required: true },
  { key: 'propertyCity', label: 'Város', type: 'text', required: true },
  { key: 'propertyPostalCode', label: 'Irányítószám', type: 'text', required: false },
  { key: 'propertyType', label: 'Ingatlan típusa', type: 'text', required: true },
  { key: 'propertySize', label: 'Alapterület (m²)', type: 'number', required: false },
  
  // Landlord variables
  { key: 'landlordName', label: 'Bérbeadó neve', type: 'text', required: true },
  { key: 'landlordEmail', label: 'Bérbeadó email', type: 'text', required: true },
  { key: 'landlordPhone', label: 'Bérbeadó telefon', type: 'text', required: true },
  { key: 'landlordAddress', label: 'Bérbeadó címe', type: 'text', required: true },
  { key: 'landlordTaxNumber', label: 'Bérbeadó adószáma', type: 'text', required: false },
  
  // Tenant variables
  { key: 'tenantName', label: 'Bérlő neve', type: 'text', required: true },
  { key: 'tenantEmail', label: 'Bérlő email', type: 'text', required: true },
  { key: 'tenantPhone', label: 'Bérlő telefon', type: 'text', required: true },
  { key: 'tenantAddress', label: 'Bérlő címe', type: 'text', required: true },
  { key: 'tenantIdNumber', label: 'Bérlő személyi száma', type: 'text', required: false },
  
  // Contract terms
  { key: 'startDate', label: 'Bérleti szerződés kezdete', type: 'date', required: true },
  { key: 'endDate', label: 'Bérleti szerződés vége', type: 'date', required: true },
  { key: 'rentAmount', label: 'Havi bérleti díj', type: 'currency', required: true },
  { key: 'deposit', label: 'Kaució', type: 'currency', required: true },
  { key: 'paymentDay', label: 'Fizetési nap (hónap napja)', type: 'number', required: true },
  { key: 'currency', label: 'Pénznem', type: 'text', required: true, defaultValue: 'EUR' },
  
  // Additional terms
  { key: 'utilitiesIncluded', label: 'Rezsi a bérleti díjban', type: 'boolean', required: false, defaultValue: false },
  { key: 'petsAllowed', label: 'Háziállat tartható', type: 'boolean', required: false, defaultValue: false },
  { key: 'smokingAllowed', label: 'Dohányzás engedélyezett', type: 'boolean', required: false, defaultValue: false },
  
  // Company data
  { key: 'companyName', label: 'Cég neve', type: 'text', required: true },
  { key: 'companyAddress', label: 'Cég címe', type: 'text', required: true },
  { key: 'companyTaxNumber', label: 'Cég adószáma', type: 'text', required: true },
  
  // Meta data
  { key: 'contractNumber', label: 'Szerződés száma', type: 'text', required: true },
  { key: 'generatedDate', label: 'Generálás dátuma', type: 'date', required: true }
]

/**
 * Replace template variables in content
 */
export function renderTemplate(template: string, data: ContractData): string {
  let rendered = template

  // Replace all {{variableName}} with actual values
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    
    let displayValue = ''
    
    if (value === null || value === undefined) {
      displayValue = ''
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Igen' : 'Nem'
    } else if (typeof value === 'number' && (key.includes('Amount') || key.includes('deposit'))) {
      displayValue = `${value.toLocaleString('hu-HU')} ${data.currency || 'EUR'}`
    } else if (typeof value === 'number') {
      displayValue = value.toString()
    } else {
      displayValue = value.toString()
    }
    
    rendered = rendered.replace(regex, displayValue)
  })

  return rendered
}

/**
 * Generate contract data from database entities
 */
export async function generateContractData(
  propertyId: string,
  tenantId: string,
  contractData: {
    startDate: Date
    endDate: Date
    rentAmount: number
    deposit: number
    paymentDay?: number
    customTerms?: string
  }
): Promise<ContractData> {
  // Fetch property with owner
  const property = await db.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: {
        include: { user: true }
      }
    }
  })

  if (!property) {
    throw new Error('Property not found')
  }

  // Fetch tenant
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: { user: true }
  })

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  // Fetch company data
  const company = await db.company.findFirst()
  
  // Generate contract number
  const contractNumber = `CTR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

  return {
    // Property data
    propertyAddress: property.street,
    propertyCity: property.city,
    propertyPostalCode: property.postalCode || '',
    propertyType: property.type,
    propertySize: property.size || undefined,
    
    // Landlord data
    landlordName: property.owner.user.name || '',
    landlordEmail: property.owner.user.email,
    landlordPhone: property.owner.user.phone || '',
    landlordAddress: `${property.owner.billingStreet || ''}, ${property.owner.billingCity || ''}`.trim(),
    landlordTaxNumber: property.owner.taxNumber || undefined,
    
    // Tenant data
    tenantName: tenant.user.name || '',
    tenantEmail: tenant.user.email,
    tenantPhone: tenant.user.phone || '',
    tenantAddress: `${tenant.emergencyName || ''} ${tenant.emergencyPhone || ''}`.trim() || 'N/A',
    tenantIdNumber: undefined,
    
    // Contract terms
    startDate: contractData.startDate.toLocaleDateString('hu-HU'),
    endDate: contractData.endDate.toLocaleDateString('hu-HU'),
    rentAmount: contractData.rentAmount,
    deposit: contractData.deposit,
    paymentDay: contractData.paymentDay || 1,
    currency: 'EUR',
    
    // Additional terms (defaults)
    utilitiesIncluded: false,
    petsAllowed: false,
    smokingAllowed: false,
    
    // Company data
    companyName: company?.name || 'Molino RENTAL Kft.',
    companyAddress: company ? `${company.street}, ${company.city}` : '',
    companyTaxNumber: company?.taxNumber || '',
    
    // Meta
    contractNumber,
    generatedDate: new Date().toLocaleDateString('hu-HU')
  }
}

/**
 * Generate HTML contract from template
 */
export async function generateContract(
  propertyId: string,
  tenantId: string,
  contractData: {
    startDate: Date
    endDate: Date
    rentAmount: number
    deposit: number
    paymentDay?: number
    customTerms?: string
  },
  templateId?: string
): Promise<ContractData> {
  
  // Generate contract data
  const data = await generateContractData(propertyId, tenantId, contractData)
  
  return data
}