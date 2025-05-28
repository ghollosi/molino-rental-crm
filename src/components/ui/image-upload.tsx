'use client'

import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  disabled
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('Upload response error:', errorData)
          throw new Error('Upload failed: ' + response.status)
        }

        const data = await response.json()
        console.log('Upload successful, URL:', data.url)
        return data.url
      })

      const newUrls = await Promise.all(uploadPromises)
      onChange([...value, ...newUrls].slice(0, maxFiles))
    } catch (error) {
      console.error('Upload error:', error)
      // Don't add blob URLs to the form - they cause validation errors
      alert('Képfeltöltési hiba történt. Kérjük próbálja újra később.')
      // Don't change the value if upload failed
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newUrls = [...value]
    newUrls.splice(index, 1)
    onChange(newUrls)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {value.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {value.length < maxFiles && (
          <label
            className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50",
              isUploading && "opacity-50 cursor-not-allowed",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500">Kép feltöltése</p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={disabled || isUploading}
            />
          </label>
        )}
      </div>
      
      {value.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Még nem töltött fel képeket
          </p>
          <p className="text-xs text-gray-500">
            Maximum {maxFiles} kép tölthető fel
          </p>
        </div>
      )}
    </div>
  )
}