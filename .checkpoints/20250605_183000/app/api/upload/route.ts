import { NextResponse } from 'next/server'
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
    
    // ALWAYS use database storage as primary option
    try {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const uniqueFilename = `${uniqueSuffix}-${filename}`

      // Store in database as base64
      const base64Data = buffer.toString('base64')
      
      // Get session but don't require it
      const session = await auth()
      let uploadedBy = 'system' // Default for anonymous uploads
      
      if (session?.user?.id) {
        // Verify user exists if we have a session
        const userExists = await db.user.findUnique({
          where: { id: session.user.id }
        })
        if (userExists) {
          uploadedBy = session.user.id
        }
      }

      // Create a system user if it doesn't exist
      if (uploadedBy === 'system') {
        const systemUser = await db.user.findFirst({
          where: { email: 'system@molino.com' }
        })
        
        if (!systemUser) {
          const bcrypt = await import('bcryptjs')
          const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10)
          const newSystemUser = await db.user.create({
            data: {
              email: 'system@molino.com',
              password: hashedPassword,
              firstName: 'System',
              lastName: 'User',
              role: 'ADMIN',
              language: 'HU',
              isActive: false // Inactive so nobody can login
            }
          })
          uploadedBy = newSystemUser.id
        } else {
          uploadedBy = systemUser.id
        }
      }

      const fileRecord = await db.uploadedFile.create({
        data: {
          filename: uniqueFilename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          data: base64Data,
          uploadedBy: uploadedBy,
        }
      })

      console.log('File stored successfully in database:', fileRecord.id)
      return NextResponse.json({ 
        url: `/api/files/${fileRecord.id}`,
        id: fileRecord.id,
        filename: uniqueFilename,
        storage: 'database'
      })
    } catch (dbError) {
      console.error('Database storage failed:', dbError)
      // Continue to try cloud storage
    }

    // Check if R2 cloud storage is configured and available
    if (cloudStorage.isConfigured()) {
      console.log('Using R2 cloud storage for upload')
      
      try {
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
          console.warn('R2 upload failed:', result.error)
        }
      } catch (r2Error) {
        console.warn('R2 upload failed:', r2Error)
      }
    }
    
    // No fallback to temporary storage - must use database or cloud storage
    return NextResponse.json({ 
      error: 'File storage not available. Please configure cloud storage or ensure database connection.',
      details: 'Production systems require persistent storage. Temporary in-memory storage has been disabled.'
    }, { status: 500 })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}