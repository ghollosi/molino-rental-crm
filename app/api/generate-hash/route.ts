import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  const password = 'admin123';
  
  // Generate multiple hash variations
  const hashBcryptjs = await bcrypt.hash(password, 10);
  
  // Test verification
  const test1 = await bcrypt.compare(password, hashBcryptjs);
  const test2 = await bcrypt.compare(password, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
  
  return NextResponse.json({
    password: password,
    newHash: hashBcryptjs,
    verification: {
      newHashValid: test1,
      oldHashValid: test2
    },
    sqlCommand: `UPDATE "User" SET password = '${hashBcryptjs}' WHERE email = 'admin@molino.com';`
  });
}