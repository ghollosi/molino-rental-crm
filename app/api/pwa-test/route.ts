import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Válaszoljunk egy egyszerű JSON-nal a PWA telepíthetőség teszteléshez
  return NextResponse.json({
    message: 'PWA test endpoint working',
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    pwaHeaders: {
      manifest: 'available at /manifest.json',
      serviceWorker: 'available at /sw.js',
      offline: 'available at /offline.html'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      message: 'PWA install event received',
      data: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
}