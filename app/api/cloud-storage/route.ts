/**
 * @file cloud-storage API route
 * @description Cloudflare R2 storage management API
 * @created 2025-06-02
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloudStorage } from '@/lib/cloud-storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Test connection, list files, download file, or get stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can access cloud storage management
    if (!['ADMIN', 'EDITOR_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const key = url.searchParams.get('key');
    const prefix = url.searchParams.get('prefix');

    switch (action) {
      case 'test':
        const testResult = await cloudStorage.testConnection();
        return NextResponse.json({
          success: testResult.success,
          configured: cloudStorage.isConfigured(),
          error: testResult.error
        });

      case 'list':
        const files = await cloudStorage.listFiles(prefix || undefined);
        return NextResponse.json({ files });

      case 'stats':
        const stats = await cloudStorage.getStorageStats();
        return NextResponse.json({ stats });

      case 'download':
        if (!key) {
          return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
        }
        
        const signedUrl = await cloudStorage.getSignedUrl(key);
        if (!signedUrl) {
          return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
        }
        
        return NextResponse.json({ downloadUrl: signedUrl });

      case 'info':
        if (!key) {
          return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
        }
        
        const fileInfo = await cloudStorage.getFileInfo(key);
        return NextResponse.json({ fileInfo });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cloud storage GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can upload to cloud storage
    if (!['ADMIN', 'EDITOR_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (!cloudStorage.isConfigured()) {
      return NextResponse.json({ 
        error: 'Cloud storage not configured. Please check R2 environment variables.' 
      }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // File size limit (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 50MB.' 
      }, { status: 413 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to R2
    const result = await cloudStorage.uploadFile(
      buffer,
      file.name,
      file.type,
      folder || 'uploads'
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Upload failed' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      filename: file.name,
      size: file.size,
      contentType: file.type
    });

  } catch (error) {
    console.error('Cloud storage POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete file
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can delete from cloud storage
    if (!['ADMIN', 'EDITOR_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (!cloudStorage.isConfigured()) {
      return NextResponse.json({ 
        error: 'Cloud storage not configured' 
      }, { status: 503 });
    }

    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }

    const result = await cloudStorage.deleteFile(key);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Delete failed' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Cloud storage DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}