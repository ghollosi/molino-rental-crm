import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST() {
  try {
    // Import PrismaClient dynamically to avoid bundling issues
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Read the SQL fix script
    const sqlPath = join(process.cwd(), 'fix-production-schema.sql');
    const sqlScript = readFileSync(sqlPath, 'utf-8');

    // Split SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    const results = [];
    
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          await prisma.$executeRawUnsafe(statement);
          results.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ 
          statement: statement.substring(0, 50) + '...', 
          status: 'error', 
          error: errorMessage 
        });
      }
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Schema fix completed',
      results,
      totalStatements: statements.length
    });

  } catch (error) {
    console.error('Schema fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}