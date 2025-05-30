'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NewOwnerModal } from '@/components/modals/new-owner-modal'
import { toast } from 'sonner'

export default function TestOwnerModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOwnerCreated = (ownerId: string) => {
    console.log('Owner created with ID:', ownerId)
    toast.success(`Tulajdonos sikeresen létrehozva! ID: ${ownerId}`)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">NewOwnerModal Teszt</h1>
      
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Ez az oldal a NewOwnerModal tesztelésére szolgál. 
          A modal a standalone API-t használja, amely megkerüli a tRPC-t.
        </p>

        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Deployment Info:</p>
          <p>Ha "Hálózati hiba" üzenetet kapsz, várj 2-3 percet a deployment propagálásáig.</p>
          <p>Nyisd meg a browser console-t (F12) és keresd ezt: "NewOwnerModal: Using standalone API"</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          Modal megnyitása
        </Button>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Debug információ:</h2>
          <pre className="text-xs">
{`Endpoint: /api/standalone-create-owner
Method: POST
Headers: Content-Type: application/json
Body: {
  "name": "example",
  "email": "example@email.com", 
  "password": "password",
  "phone": "+36201234567",
  "taxNumber": "12345678-1-42"
}`}
          </pre>
        </div>
      </div>

      <NewOwnerModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onOwnerCreated={handleOwnerCreated}
      />
    </div>
  )
}