import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileRecord = await db.uploadedFile.findUnique({
      where: { id: params.id }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(fileRecord.data, 'base64')

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileRecord.mimeType,
        'Content-Length': fileRecord.size.toString(),
        'Content-Disposition': `inline; filename="${fileRecord.originalName}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}