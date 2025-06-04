import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { cloudStorage } from '@/lib/cloud-storage'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    const file = data.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Try database storage first if user is authenticated
    const session = await auth()
    if (session?.user?.id) {
      try {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniqueFilename = `${uniqueSuffix}-${filename}`

        // Store in database as base64
        const base64Data = buffer.toString('base64')
        const fileRecord = await db.uploadedFile.create({
          data: {
            filename: uniqueFilename,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            data: base64Data,
            uploadedBy: session.user.id,
          }
        })

        return NextResponse.json({ 
          url: `/api/files/${fileRecord.id}`,
          id: fileRecord.id,
          filename: uniqueFilename,
          storage: 'database'
        })
      } catch (dbError) {
        console.warn('Database storage failed, falling back to other methods:', dbError)
      }
    }

    // Check if R2 cloud storage is configured and available
    if (cloudStorage.isConfigured()) {
      console.log('Using R2 cloud storage for upload')
      
      // Upload to R2
      const result = await cloudStorage.uploadFile(
        buffer,
        file.name,
        file.type,
        'uploads'
      )
      
      if (result.success) {
        return NextResponse.json({ 
          url: result.url,
          key: result.key,
          storage: 'r2'
        })
      } else {
        console.warn('R2 upload failed, falling back to local storage:', result.error)
      }
    }
    
    // Fallback to local storage
    console.log('Using local storage for upload')
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${uniqueSuffix}-${filename}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    try {
      // Ensure upload directory exists
      const fs = require('fs')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
    } catch (dirError) {
      console.log('Upload directory already exists or created')
    }
    
    // Save file to uploads directory
    const filePath = path.join(uploadDir, uniqueFilename)
    await writeFile(filePath, buffer)
    
    const url = `/uploads/${uniqueFilename}`
    
    return NextResponse.json({ 
      url,
      storage: 'local'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}