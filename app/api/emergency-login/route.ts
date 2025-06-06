import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Emergency admin credentials
    const ADMIN_EMAIL = 'admin@molino.com';
    const ADMIN_PASSWORD = 'admin123';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create a simple session token
      const sessionToken = Buffer.from(JSON.stringify({
        user: {
          id: 'emergency-admin',
          email: ADMIN_EMAIL,
          firstName: 'Emergency',
          lastName: 'Admin',
          role: 'ADMIN'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })).toString('base64');

      const response = NextResponse.json({
        success: true,
        user: {
          id: 'emergency-admin',
          email: ADMIN_EMAIL,
          firstName: 'Emergency',
          lastName: 'Admin',
          role: 'ADMIN'
        },
        message: 'Emergency login successful'
      });

      // Set emergency session cookie
      response.cookies.set('emergency-session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      });

      return response;
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid credentials'
    }, { status: 401 });

  } catch (error) {
    console.error('Emergency login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Emergency login endpoint - use POST with email/password',
    usage: 'POST /api/emergency-login with {"email": "admin@molino.com", "password": "admin123"}'
  });
}