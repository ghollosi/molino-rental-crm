import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

export async function POST() {
  let pool: Pool | null = null;
  
  try {
    // Direct PostgreSQL connection without Prisma
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    // Generate new password hash
    const correctPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);

    // Update admin password with raw SQL
    const updateResult = await client.query(
      'UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING id, email, "firstName", role',
      [hashedPassword, 'admin@molino.com']
    );

    // Verify the user exists and was updated
    const verifyResult = await client.query(
      'SELECT id, email, "firstName", role, password FROM "User" WHERE email = $1',
      ['admin@molino.com']
    );

    client.release();

    if (updateResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found or not updated'
      });
    }

    // Test password verification
    const storedHash = verifyResult.rows[0].password;
    const isValidPassword = await bcrypt.compare(correctPassword, storedHash);

    return NextResponse.json({
      success: true,
      message: 'Admin password updated successfully via raw SQL',
      admin: updateResult.rows[0],
      verification: {
        passwordValid: isValidPassword,
        hashLength: storedHash.length,
        hashPreview: storedHash.substring(0, 20) + '...'
      }
    });

  } catch (error) {
    console.error('SQL password fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'SQL_ERROR'
    }, { status: 500 });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}