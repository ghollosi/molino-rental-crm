const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function checkProductionDB() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.waxkekakjjlgavqfrqla:Gabo123kekw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking production database...');
    
    // Check admin user
    const adminResult = await pool.query(`
      SELECT id, email, name, password, role, "isActive", "createdAt", "updatedAt"
      FROM "User" 
      WHERE email = 'admin@molino.com'
    `);
    
    console.log('📧 Admin user:', adminResult.rows[0]);
    
    // Test password hash
    if (adminResult.rows[0]) {
      const user = adminResult.rows[0];
      console.log('🔐 Testing password hashes...');
      
      const passwords = ['admin123', 'admin', 'password'];
      for (const pass of passwords) {
        const isValid = await bcrypt.compare(pass, user.password);
        console.log(`Password "${pass}": ${isValid ? '✅ VALID' : '❌ invalid'}`);
      }
    }
    
    // Check all users
    const allUsers = await pool.query('SELECT id, email, name, role FROM "User" ORDER BY "createdAt"');
    console.log('\n👥 All users in database:');
    allUsers.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - name: "${user.name}"`);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkProductionDB();