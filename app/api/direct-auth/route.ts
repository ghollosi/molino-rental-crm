import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Check if admin credentials
    if (email !== 'admin@molino.com' || password !== 'admin123') {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Create a direct session token
    const sessionToken = Buffer.from(JSON.stringify({
      user: {
        id: 'cmb9bk7zv0000jnsh3qx43rth',
        email: 'admin@molino.com',
        name: 'Admin User',
        role: 'ADMIN'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })).toString('base64');

    // Set multiple session cookies to ensure compatibility
    const cookieStore = cookies();
    
    // NextAuth session token
    cookieStore.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    // Also set for production
    cookieStore.set('__Secure-next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    // Set a bypass flag
    cookieStore.set('auth-bypass', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      redirect: '/dashboard'
    });

  } catch (error) {
    console.error('Direct auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication failed'
    }, { status: 500 });
  }
}