import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class ProjectStatus {
  showFullStatus() {
    console.clear();
    console.log('🚀 MOLINO RENTAL CRM - PROJECT STATUS\n');
    
    this.showGitStatus();
    this.showDatabaseStatus();
    this.showDependencyStatus();
    this.showFileStructure();
    this.showLastChanges();
    this.showCurrentTasks();
    this.showTestStatus();
  }
  
  private showGitStatus() {
    console.log('📊 GIT STATUS:');
    try {
      const branch = execSync('git branch --show-current').toString().trim();
      const status = execSync('git status --short').toString().trim();
      const lastCommit = execSync('git log -1 --oneline').toString().trim();
      
      console.log(`  Branch: ${branch}`);
      console.log(`  Last commit: ${lastCommit}`);
      console.log(`  Changes: ${status ? '\n' + status : 'No changes'}`);
    } catch (e) {
      console.log('  No git repository');
    }
    console.log('');
  }
  
  private showDatabaseStatus() {
    console.log('🗄️  DATABASE STATUS:');
    try {
      const migrations = execSync('npx prisma migrate status').toString();
      const hasPending = migrations.includes('Following migration');
      
      console.log(`  Status: ${hasPending ? '⚠️  Pending migrations' : '✅ Up to date'}`);
    } catch {
      console.log('  Status: ❌ Not configured');
    }
    console.log('');
  }
  
  private showDependencyStatus() {
    console.log('📦 DEPENDENCIES:');
    try {
      const outdated = execSync('npm outdated --json').toString();
      const packages = JSON.parse(outdated || '{}');
      const count = Object.keys(packages).length;
      
      console.log(`  Status: ${count > 0 ? `⚠️  ${count} outdated packages` : '✅ All up to date'}`);
    } catch {
      console.log('  Status: ✅ All up to date');
    }
    console.log('');
  }
  
  private showFileStructure() {
    console.log('📁 KEY FILES:');
    const keyFiles = [
      'src/app/(dashboard)/page.tsx',
      'src/server/routers/_app.ts',
      'prisma/schema.prisma',
      '.env.local'
    ];
    
    keyFiles.forEach(file => {
      const exists = fs.existsSync(file);
      console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    });
    console.log('');
  }
  
  private showLastChanges() {
    console.log('🕐 RECENT CHANGES:');
    try {
      const recentFiles = execSync('find . -name "*.ts" -o -name "*.tsx" -mtime -1 | grep -v node_modules | head -5')
        .toString()
        .trim()
        .split('\n');
      
      recentFiles.forEach(file => {
        if (file) console.log(`  - ${file}`);
      });
    } catch {
      console.log('  No recent changes');
    }
    console.log('');
  }
  
  private showCurrentTasks() {
    console.log('📋 CURRENT TASKS:');
    try {
      const progress = fs.readFileSync('PROGRESS.md', 'utf-8');
      const pendingTasks = progress.match(/\[ \] (.+)/g);
      
      if (pendingTasks) {
        pendingTasks.slice(0, 5).forEach(task => {
          console.log(`  ${task}`);
        });
      } else {
        console.log('  No pending tasks found');
      }
    } catch {
      console.log('  PROGRESS.md not found');
    }
    console.log('');
  }
  
  private showTestStatus() {
    console.log('🧪 TEST STATUS:');
    const testDirs = ['tests/unit', 'tests/integration', 'tests/e2e'];
    
    testDirs.forEach(dir => {
      const exists = fs.existsSync(dir);
      const count = exists ? fs.readdirSync(dir).length : 0;
      console.log(`  ${dir}: ${count} files`);
    });
  }
}

// Run status check
new ProjectStatus().showFullStatus();