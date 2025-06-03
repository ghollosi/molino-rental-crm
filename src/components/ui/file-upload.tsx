'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, FileImage, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface FileUploadProps {
  label: string
  value?: string
  onChange: (url: string | undefined) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  description?: string
  disabled?: boolean
}

export function FileUpload({
  label,
  value,
  onChange,
  accept = 'image/*',
  maxSize = 5,
  className,
  description,
  disabled = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`A fájl mérete nem lehet nagyobb ${maxSize}MB-nál`)
      return
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setError('Nem támogatott fájltípus')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Feltöltési hiba')
      }

      const result = await response.json()
      onChange(result.url)
    } catch (error) {
      console.error('Upload error:', error)
      setError('Hiba történt a fájl feltöltése során')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const isImage = value && (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.gif') || value.includes('.webp'))

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      
      <div className="space-y-3">
        {/* Current file preview */}
        {value && (
          <div className="relative p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isImage ? (
                  <div className="relative w-12 h-12 rounded border">
                    <Image
                      src={value}
                      alt="Preview"
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <FileImage className="w-8 h-8 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {value.split('/').pop() || 'Feltöltött fájl'}
                  </p>
                  <p className="text-xs text-gray-500">Sikeresen feltöltve</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={isUploading || disabled}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? 'Feltöltés...' : value ? 'Fájl cseréje' : 'Fájl kiválasztása'}
          </Button>
          
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}