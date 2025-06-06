import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'undefined'
  });
}