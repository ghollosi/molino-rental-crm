/**
 * Cloud Storage API Endpoint
 * 
 * Kezeli a fájlfeltöltést, letöltést és törlést a Cloudflare R2-n keresztül
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, downloadFile, deleteFile, listFiles, testConnection, generateFileKey, getContentType } from '@/src/lib/cloud-storage';

// POST - Fájl feltöltése
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefix = formData.get('prefix') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Fájl kulcs generálása
    const fileKey = generateFileKey(file.name, prefix);
    const contentType = getContentType(file.name);

    // Fájl feltöltése
    const result = await uploadFile({
      key: fileKey,
      file: file,
      contentType: contentType,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'File uploaded successfully',
    });

  } catch (error) {
    console.error('Cloud storage upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET - Fájl letöltése vagy lista lekérése
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key');
    const prefix = searchParams.get('prefix');
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100');

    // Fájlok listázása
    if (action === 'list') {
      const files = await listFiles(prefix || undefined, maxKeys);
      
      return NextResponse.json({
        success: true,
        data: files,
        count: files.length,
      });
    }

    // Kapcsolat tesztelése
    if (action === 'test') {
      const isConnected = await testConnection();
      
      return NextResponse.json({
        success: true,
        connected: isConnected,
        message: isConnected ? 'Connection successful' : 'Connection failed',
      });
    }

    // Fájl letöltése
    if (action === 'download' && key) {
      const fileBuffer = await downloadFile(key);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Cloud storage GET error:', error);
    return NextResponse.json(
      { 
        error: 'Operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Fájl törlése
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    await deleteFile(key);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      key: key,
    });

  } catch (error) {
    console.error('Cloud storage delete error:', error);
    return NextResponse.json(
      { 
        error: 'Delete failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}