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
    console.log('File selected:', file)
    
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      maxSize: maxSize * 1024 * 1024
    })

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `A fájl mérete nem lehet nagyobb ${maxSize}MB-nál`
      console.error('File size validation failed:', errorMsg)
      setError(errorMsg)
      return
    }

    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      const errorMsg = 'Nem támogatott fájltípus'
      console.error('File type validation failed:', errorMsg, 'accept:', accept, 'file.type:', file.type)
      setError(errorMsg)
      return
    }

    console.log('File validations passed, starting upload...')
    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      console.log('FormData created, making fetch request...')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Fetch response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload response error:', response.status, errorText)
        throw new Error(`Feltöltési hiba: ${response.status} - ${errorText}`)
      }

      // Try to parse JSON response with better error handling
      let result
      try {
        const responseText = await response.text()
        console.log('Raw response text:', responseText)
        result = JSON.parse(responseText)
        console.log('Parsed JSON result:', result)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error(`Feltöltési hiba: Érvénytelen válasz a szervertől`)
      }

      // Validate response structure
      if (!result || !result.url) {
        console.error('Invalid response structure:', result)
        throw new Error(`Feltöltési hiba: Hiányzó URL a válaszban`)
      }

      console.log('Upload success, calling onChange with URL:', result.url)
      onChange(result.url)
    } catch (error) {
      console.error('Upload error caught:', error)
      if (error instanceof Error && error.message.includes('429')) {
        setError('Túl sok feltöltési kérés. Kérjük várjon egy percet, majd próbálja újra.')
      } else {
        setError(`Hiba történt a fájl feltöltése során: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`)
      }
    } finally {
      console.log('Upload process finished, setting isUploading to false')
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
                      sizes="48px"
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