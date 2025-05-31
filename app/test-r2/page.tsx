'use client'

import { useState } from 'react'
import { ImageUpload } from '@/src/components/image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestR2Page() {
  const [images, setImages] = useState<string[]>([])
  const [useR2, setUseR2] = useState(false)

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>R2 Cloud Storage Test</CardTitle>
          <div className="flex items-center gap-4">
            <Button 
              variant={useR2 ? "default" : "outline"}
              onClick={() => setUseR2(true)}
            >
              R2 Cloud Storage
            </Button>
            <Button 
              variant={!useR2 ? "default" : "outline"}
              onClick={() => setUseR2(false)}
            >
              Placeholder Mode
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Jelenleg: {useR2 ? 'Cloudflare R2 aktív' : 'Placeholder mode aktív'}
          </p>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxFiles={3}
            useCloudStorage={useR2}
          />
          
          {images.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Feltöltött képek URL-jei:</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(images, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}