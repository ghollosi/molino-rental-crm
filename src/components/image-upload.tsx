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
  useCloudStorage?: boolean // New prop to enable/disable R2
}

export function ImageUpload({ value, onChange, maxFiles = 5, useCloudStorage = false }: ImageUploadProps) {
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
      if (useCloudStorage) {
        // Cloud storage (R2) upload
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          
          // Determine prefix based on the page context
          const currentPath = window.location.pathname
          let prefix = 'general'
          if (currentPath.includes('issues')) {
            prefix = 'issues'
          } else if (currentPath.includes('properties')) {
            prefix = 'properties'
          } else if (currentPath.includes('tenants')) {
            prefix = 'tenants'
          } else if (currentPath.includes('owners')) {
            prefix = 'owners'
          }
          
          formData.append('prefix', prefix)

          const response = await fetch('/api/cloud-storage', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Upload failed')
          }

          const result = await response.json()
          return result.data.url
        })

        const newUrls = await Promise.all(uploadPromises)
        onChange([...value, ...newUrls])
      } else {
        // Placeholder mode (fallback)
        const newUrls = files.map((file, index) => 
          `placeholder-${Date.now()}-${index}-${file.name}`
        )
        onChange([...value, ...newUrls])
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Hiba történt a feltöltés során: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = async (index: number) => {
    const urlToRemove = value[index]
    
    // If it's a real cloud storage URL and cloud storage is enabled, delete it from R2
    if (useCloudStorage && urlToRemove && !urlToRemove.startsWith('placeholder-') && urlToRemove.includes('r2.cloudflarestorage.com')) {
      try {
        // Extract the key from the URL
        const url = new URL(urlToRemove)
        const key = url.pathname.substring(1) // Remove leading slash
        
        const response = await fetch(`/api/cloud-storage?key=${encodeURIComponent(key)}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          console.error('Failed to delete file from cloud storage')
        }
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }
    
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
                  {url.startsWith('placeholder-') ? (
                    <Image
                      src="/placeholder.svg"
                      alt={`Document ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Document ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        console.error('Image load error:', url);
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  )}
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