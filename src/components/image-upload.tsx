'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Upload, FileText } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
}

export function ImageUpload({ value, onChange, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (value.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} fájl tölthető fel`)
      return
    }

    setUploading(true)
    try {
      // TODO: Implement actual file upload to cloud storage
      // For now, we'll just use placeholder URLs
      const newUrls = files.map((file, index) => 
        `placeholder-${Date.now()}-${index}-${file.name}`
      )
      onChange([...value, ...newUrls])
    } catch (error) {
      console.error('Upload error:', error)
      alert('Hiba történt a feltöltés során')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  const isImage = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    return imageExtensions.some(ext => url.toLowerCase().includes(ext))
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <Card key={index} className="relative p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              {isImage(url) ? (
                <div className="relative h-32 w-full">
                  <Image
                    src={url.startsWith('placeholder-') ? '/placeholder.svg' : url}
                    alt={`Document ${index + 1}`}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center bg-gray-100 rounded">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <p className="text-xs text-center mt-2 truncate">
                {url.split('/').pop() || url}
              </p>
            </Card>
          ))}
        </div>
      )}

      {value.length < maxFiles && (
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Feltöltés...' : 'Fájlok feltöltése'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Még {maxFiles - value.length} fájl tölthető fel
          </p>
        </div>
      )}
    </div>
  )
}