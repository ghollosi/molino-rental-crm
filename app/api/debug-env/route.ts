import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    deployment_url: process.env.VERCEL_URL,
    vercel_env: process.env.VERCEL_ENV,
  })
}