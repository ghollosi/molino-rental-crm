import { NextResponse } from 'next/server';
import { testConnection } from '@/src/lib/cloud-storage';

export async function GET() {
  try {
    console.log('Debug R2 environment variables:');
    console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
    console.log('R2_BUCKET:', process.env.R2_BUCKET || process.env.R2_BUCKET_NAME);
    console.log('R2_ACCESS_KEY_ID exists:', !!process.env.R2_ACCESS_KEY_ID);
    console.log('R2_SECRET_ACCESS_KEY exists:', !!process.env.R2_SECRET_ACCESS_KEY);
    
    const isConnected = await testConnection();
    
    return NextResponse.json({
      success: true,
      connection: isConnected,
      environment: {
        endpoint: process.env.R2_ENDPOINT,
        bucket: process.env.R2_BUCKET || process.env.R2_BUCKET_NAME,
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      },
      message: isConnected ? 'R2 connection successful' : 'R2 connection failed'
    });
  } catch (error) {
    console.error('Debug R2 error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          endpoint: process.env.R2_ENDPOINT,
          bucket: process.env.R2_BUCKET || process.env.R2_BUCKET_NAME,
          hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        }
      },
      { status: 500 }
    );
  }
}