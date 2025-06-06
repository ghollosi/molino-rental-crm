#!/usr/bin/env tsx
/**
 * PRODUCTION ENVIRONMENT TESZTELŐ SCRIPT
 * Automatikusan teszteli a production environment működését
 * 
 * Használat:
 * npx tsx scripts/test-production.ts
 */

interface TestResult {
  name: string;
  url: string;
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
}

const PRODUCTION_URL = 'https://molino-rental-crm.vercel.app';

const tests = [
  {
    name: 'Main Page Load',
    url: `${PRODUCTION_URL}`,
    expectedStatus: [200, 302] // 302 redirect to login is OK
  },
  {
    name: 'Login Page',
    url: `${PRODUCTION_URL}/login`,
    expectedStatus: [200]
  },
  {
    name: 'API Health Check',
    url: `${PRODUCTION_URL}/api/health-check`,
    expectedStatus: [200]
  },
  {
    name: 'Bypass Login',
    url: `${PRODUCTION_URL}/api/bypass-login`,
    expectedStatus: [302] // Should redirect
  },
  {
    name: 'Force Login',
    url: `${PRODUCTION_URL}/api/force-login`,
    expectedStatus: [302] // Should redirect
  },
  {
    name: 'Test Login API',
    url: `${PRODUCTION_URL}/api/test-login`,
    method: 'POST',
    body: {
      email: 'admin@molino.com',
      password: 'admin123'
    },
    expectedStatus: [200]
  },
  {
    name: 'Direct Login Page',
    url: `${PRODUCTION_URL}/direct-login`,
    expectedStatus: [200]
  },
  {
    name: 'tRPC Health',
    url: `${PRODUCTION_URL}/api/trpc/healthcheck`,
    expectedStatus: [200, 405] // 405 Method not allowed is OK for GET
  }
];

async function runTest(test: any): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const options: RequestInit = {
      method: test.method || 'GET',
      headers: {
        'User-Agent': 'Molino-Test-Script/1.0'
      }
    };

    if (test.body) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(test.body);
    }

    const response = await fetch(test.url, options);
    const responseTime = Date.now() - startTime;
    
    const success = test.expectedStatus.includes(response.status);
    
    return {
      name: test.name,
      url: test.url,
      success,
      responseTime,
      statusCode: response.status,
      error: success ? undefined : `Expected ${test.expectedStatus}, got ${response.status}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: test.name,
      url: test.url,
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testDatabase() {
  console.log('\n🔍 ADATBÁZIS KAPCSOLAT TESZTELÉSE...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@molino.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('   ✅ Adatbázis kapcsolat működik');
      console.log('   ✅ Admin user létezik és elérhető');
      return true;
    } else {
      console.log('   ❌ Adatbázis kapcsolat probléma');
      console.log('   ❌ Válasz:', data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Adatbázis kapcsolat hiba:', error);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 AUTHENTICATION TESZTELÉSE...');
  
  // Test bypass login
  try {
    const bypassResponse = await fetch(`${PRODUCTION_URL}/api/bypass-login`, {
      redirect: 'manual' // Don't follow redirects
    });
    
    if (bypassResponse.status === 302) {
      console.log('   ✅ Bypass login működik (redirect)');
    } else {
      console.log('   ⚠️  Bypass login váratlan válasz:', bypassResponse.status);
    }
  } catch (error) {
    console.log('   ❌ Bypass login hiba:', error);
  }

  // Test force login
  try {
    const forceResponse = await fetch(`${PRODUCTION_URL}/api/force-login`, {
      redirect: 'manual'
    });
    
    if (forceResponse.status === 302) {
      console.log('   ✅ Force login működik (redirect)');
    } else {
      console.log('   ⚠️  Force login váratlan válasz:', forceResponse.status);
    }
  } catch (error) {
    console.log('   ❌ Force login hiba:', error);
  }
}

async function generateTestReport(results: TestResult[]) {
  console.log('\n📊 TESZT EREDMÉNYEK ÖSSZESÍTÉSE...');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const averageResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );

  console.log('\n' + '='.repeat(60));
  console.log('📋 PRODUCTION TESZT JELENTÉS');
  console.log('='.repeat(60));
  
  console.log(`\n📈 ÖSSZESÍTÉS:`);
  console.log(`   Sikeres tesztek: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  console.log(`   Átlagos válaszidő: ${averageResponseTime}ms`);
  
  console.log(`\n📝 RÉSZLETES EREDMÉNYEK:`);
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const time = `${result.responseTime}ms`;
    const statusCode = result.statusCode ? ` [${result.statusCode}]` : '';
    
    console.log(`   ${status} ${result.name}: ${time}${statusCode}`);
    if (result.error) {
      console.log(`      ⚠️  ${result.error}`);
    }
  });

  // Gyorsdiagnosztika
  console.log(`\n🔧 GYORSDIAGNOSZTIKA:`);
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length === 0) {
    console.log('   🎉 Minden teszt sikeres! A production környezet tökéletesen működik.');
  } else {
    console.log('   ⚠️  Hibás tesztek találhatók:');
    failedTests.forEach(test => {
      console.log(`      - ${test.name}: ${test.error}`);
    });
    
    // Gyakori problémák diagnosztikája
    const mainPageFailed = failedTests.some(t => t.name === 'Main Page Load');
    const apiHealthFailed = failedTests.some(t => t.name === 'API Health Check');
    const dbTestExists = results.find(t => t.name === 'Test Login API');
    
    console.log(`\n💡 JAVASOLT MEGOLDÁSOK:`);
    
    if (mainPageFailed) {
      console.log('   - Main Page nem tölthető be → Ellenőrizd a Vercel deployment státuszát');
    }
    
    if (apiHealthFailed) {
      console.log('   - API Health Check sikertelen → Server-side probléma (environment változók?)');
    }
    
    if (dbTestExists && !dbTestExists.success) {
      console.log('   - Adatbázis hiba → Ellenőrizd a DATABASE_URL-t és futtasd: npx tsx scripts/supabase-production-setup.ts');
    }
    
    if (failedTests.some(t => t.error?.includes('ECONNREFUSED'))) {
      console.log('   - Kapcsolódási hiba → A Vercel app nem fut vagy DNS probléma');
    }
  }

  // Next Steps
  console.log(`\n🎯 KÖVETKEZŐ LÉPÉSEK:`);
  if (successCount === totalCount) {
    console.log('   1. ✅ Teszteld manuálisan: https://molino-rental-crm.vercel.app');
    console.log('   2. ✅ Jelentkezz be: admin@molino.com / admin123');
    console.log('   3. ✅ Ellenőrizd a Dashboard funkciókat');
    console.log('   4. ✅ Teszteld a CRUD műveleteket');
  } else {
    console.log('   1. 🔧 Javítsd a hibás teszteket');
    console.log('   2. 📋 Ellenőrizd a Vercel Function logokat');
    console.log('   3. 🔄 Futtasd újra: npx tsx scripts/test-production.ts');
  }

  return {
    successRate: successCount / totalCount,
    averageResponseTime,
    allPassed: successCount === totalCount
  };
}

async function main() {
  console.log('🧪 MOLINO RENTAL CRM - PRODUCTION TESZT');
  console.log('========================================');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Test időpont: ${new Date().toLocaleString('hu-HU')}`);

  console.log('\n🚀 ALAPVETŐ ENDPOINT TESZTEK FUTTATÁSA...');
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    process.stdout.write(`   Testing ${test.name}... `);
    const result = await runTest(test);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    const time = `(${result.responseTime}ms)`;
    console.log(`${status} ${time}`);
  }

  // Adatbázis teszt
  const dbSuccess = await testDatabase();

  // Authentication teszt
  await testAuthentication();

  // Összesítő jelentés
  const report = await generateTestReport(results);

  // Végső státusz
  console.log('\n' + '='.repeat(60));
  if (report.allPassed && dbSuccess) {
    console.log('🎉 PRODUCTION ENVIRONMENT: TÖKÉLETESEN MŰKÖDIK!');
  } else if (report.successRate > 0.7) {
    console.log('⚠️  PRODUCTION ENVIRONMENT: TÖBBNYIRE MŰKÖDIK (kisebb hibákkal)');
  } else {
    console.log('❌ PRODUCTION ENVIRONMENT: SÚLYOS PROBLÉMÁK');
  }
  console.log('='.repeat(60));
}

// Script futtatása
main().catch(console.error);