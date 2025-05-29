'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">Hiba történt!</h2>
        <p className="mb-6 text-gray-600">
          Sajnáljuk, valami hiba történt az alkalmazásban.
        </p>
        <div className="space-y-2">
          <Button
            onClick={() => reset()}
            className="w-full max-w-xs"
          >
            Próbálja újra
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full max-w-xs"
          >
            Vissza a főoldalra
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left max-w-2xl mx-auto">
            <summary className="cursor-pointer text-sm text-gray-500">
              Hiba részletei (fejlesztői mód)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}