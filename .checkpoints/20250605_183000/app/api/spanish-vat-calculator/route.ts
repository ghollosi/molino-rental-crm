/**
 * Spanish VAT Calculator API
 * Calculate Spanish IVA for different rental scenarios
 */

import { NextRequest, NextResponse } from 'next/server'
import { getZohoBooksClient } from '@/lib/zoho-books'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, calculateOnly } = body

    // Validate input
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({
        error: 'Invalid input. Expected array of items.'
      }, { status: 400 })
    }

    for (const item of items) {
      if (!item.type || !item.amount || typeof item.amount !== 'number') {
        return NextResponse.json({
          error: 'Each item must have type and amount'
        }, { status: 400 })
      }
    }

    const zoho = getZohoBooksClient()
    
    // Calculate VAT for each item
    const calculations = items.map((item: { type: string, amount: number, description?: string }) => {
      let vatRate = 21 // Default IVA General

      // Determine Spanish VAT rate based on type
      switch (item.type) {
        case 'rental_tourist':
          vatRate = 21 // Vivienda turística - IVA General
          break
        case 'rental_residential':
          vatRate = 0 // Vivienda habitual - IVA Exento
          break
        case 'maintenance':
          vatRate = 21 // Servicios de reparación - IVA General
          break
        case 'utilities':
          vatRate = 10 // Suministros básicos - IVA Reducido
          break
        case 'cleaning':
          vatRate = 21 // Servicios de limpieza - IVA General
          break
        case 'insurance':
          vatRate = 0 // Seguros - IVA Exento
          break
        default:
          vatRate = 21 // Otros servicios - IVA General
      }

      const vatBreakdown = zoho.calculateSpanishVAT(item.amount, vatRate)

      return {
        type: item.type,
        description: item.description || getSpanishTypeDescription(item.type),
        netAmount: vatBreakdown.netAmount,
        vatRate: vatBreakdown.vatRate,
        vatAmount: vatBreakdown.vatAmount,
        grossAmount: vatBreakdown.grossAmount,
        vatName: getSpanishVATName(vatRate),
      }
    })

    // Calculate totals
    const totals = {
      totalNet: calculations.reduce((sum, calc) => sum + calc.netAmount, 0),
      totalVAT: calculations.reduce((sum, calc) => sum + calc.vatAmount, 0),
      totalGross: calculations.reduce((sum, calc) => sum + calc.grossAmount, 0),
    }

    // Group by VAT rate for summary
    const vatSummary = calculations.reduce((acc, calc) => {
      const key = calc.vatRate
      if (!acc[key]) {
        acc[key] = {
          vatRate: calc.vatRate,
          vatName: calc.vatName,
          netAmount: 0,
          vatAmount: 0,
        }
      }
      acc[key].netAmount += calc.netAmount
      acc[key].vatAmount += calc.vatAmount
      return acc
    }, {} as Record<number, any>)

    const response = {
      calculations,
      totals: {
        totalNet: Math.round(totals.totalNet * 100) / 100,
        totalVAT: Math.round(totals.totalVAT * 100) / 100,
        totalGross: Math.round(totals.totalGross * 100) / 100,
        currency: 'EUR',
      },
      vatSummary: Object.values(vatSummary).map(summary => ({
        ...summary,
        netAmount: Math.round(summary.netAmount * 100) / 100,
        vatAmount: Math.round(summary.vatAmount * 100) / 100,
      })),
      calculatedAt: new Date().toISOString(),
      disclaimer: 'Cálculo orientativo según normativa española vigente. Consulte con un asesor fiscal para casos específicos.',
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Spanish VAT calculation error:', error)
    return NextResponse.json({
      error: 'Internal server error during VAT calculation'
    }, { status: 500 })
  }
}

function getSpanishTypeDescription(type: string): string {
  switch (type) {
    case 'rental_tourist':
      return 'Alquiler de vivienda turística'
    case 'rental_residential':
      return 'Alquiler de vivienda habitual'
    case 'maintenance':
      return 'Servicios de mantenimiento y reparación'
    case 'utilities':
      return 'Suministros básicos (agua, luz, gas)'
    case 'cleaning':
      return 'Servicios de limpieza'
    case 'insurance':
      return 'Seguro de vivienda'
    default:
      return 'Otros servicios'
  }
}

function getSpanishVATName(rate: number): string {
  switch (rate) {
    case 21:
      return 'IVA General'
    case 10:
      return 'IVA Reducido'
    case 4:
      return 'IVA Superreducido'
    case 0:
      return 'IVA Exento'
    default:
      return 'IVA General'
  }
}

export async function GET(request: NextRequest) {
  // Return Spanish VAT information and rates
  return NextResponse.json({
    title: 'Calculadora de IVA Español - Alquileres',
    description: 'Calculadora de IVA para diferentes tipos de alquileres y servicios en España',
    vatRates: {
      'IVA General (21%)': {
        rate: 21,
        description: 'Servicios generales, alquileres turísticos, mantenimiento',
        applies_to: ['rental_tourist', 'maintenance', 'cleaning'],
      },
      'IVA Reducido (10%)': {
        rate: 10,
        description: 'Suministros básicos, algunos servicios esenciales',
        applies_to: ['utilities'],
      },
      'IVA Superreducido (4%)': {
        rate: 4,
        description: 'Productos de primera necesidad (raro en alquileres)',
        applies_to: [],
      },
      'IVA Exento (0%)': {
        rate: 0,
        description: 'Alquiler de vivienda habitual, seguros',
        applies_to: ['rental_residential', 'insurance'],
      },
    },
    supportedTypes: [
      'rental_tourist',
      'rental_residential', 
      'maintenance',
      'utilities',
      'cleaning',
      'insurance',
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/spanish-vat-calculator',
      body: {
        items: [
          {
            type: 'rental_tourist',
            amount: 1000,
            description: 'Optional description'
          }
        ]
      }
    },
    lastUpdated: '2025-06-04',
    version: '1.0.0',
  })
}