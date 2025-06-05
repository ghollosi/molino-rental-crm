'use client'

import { useEffect, useState } from 'react'

interface ClientDateProps {
  date: string | Date
  format?: 'date' | 'datetime'
}

export function ClientDate({ date, format = 'date' }: ClientDateProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span>-</span>
  }

  const dateObj = new Date(date)
  
  if (format === 'datetime') {
    return <span>{dateObj.toLocaleString('hu-HU')}</span>
  }
  
  return <span>{dateObj.toLocaleDateString('hu-HU')}</span>
}

interface ClientCurrencyProps {
  amount: number
  currency?: string
}

export function ClientCurrency({ amount, currency = 'HUF' }: ClientCurrencyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span>-</span>
  }

  return <span>{amount.toLocaleString('hu-HU')} {currency === 'HUF' ? 'Ft' : currency}</span>
}