'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Kritikus hiba történt!
        </h2>
        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Az alkalmazás váratlan hibába ütközött.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            marginRight: '0.5rem',
          }}
        >
          Újratöltés
        </button>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          Főoldal
        </button>
        {process.env.NODE_ENV === 'development' && (
          <pre style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            textAlign: 'left',
            overflow: 'auto',
            maxWidth: '40rem',
          }}>
            {error.message}
          </pre>
        )}
      </div>
    </div>
  )
}