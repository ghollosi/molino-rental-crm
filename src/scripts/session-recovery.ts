import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface SessionData {
  timestamp: string;
  lastCommand: string;
  currentFile: string;
  gitStatus: string;
  installedPackages: string[];
  migrationStatus: string;
  currentPhase: string;
  completedTasks: string[];
  pendingTasks: string[];
}

export class SessionRecovery {
  private sessionFile = path.join(process.cwd(), '.session-state.json');
  
  saveState() {
    const state: SessionData = {
      timestamp: new Date().toISOString(),
      lastCommand: process.argv.slice(2).join(' '),
      currentFile: this.getCurrentFile(),
      gitStatus: this.getGitStatus(),
      installedPackages: this.getInstalledPackages(),
      migrationStatus: this.getMigrationStatus(),
      currentPhase: this.getCurrentPhase(),
      completedTasks: this.getCompletedTasks(),
      pendingTasks: this.getPendingTasks(),
    };
    
    fs.writeFileSync(this.sessionFile, JSON.stringify(state, null, 2));
  }
  
  recoverState() {
    if (!fs.existsSync(this.sessionFile)) {
      console.log('No previous session found.');
      return null;
    }
    
    const state = JSON.parse(fs.readFileSync(this.sessionFile, 'utf-8'));
    
    console.log('=== PREVIOUS SESSION RECOVERY ===');
    console.log(`Last active: ${state.timestamp}`);
    console.log(`Last command: ${state.lastCommand}`);
    console.log(`Current file: ${state.currentFile}`);
    console.log(`Current phase: ${state.currentPhase}`);
    console.log('\nCompleted tasks:');
    state.completedTasks.forEach((task: string) => console.log(`  ✓ ${task}`));
    console.log('\nPending tasks:');
    state.pendingTasks.forEach((task: string) => console.log(`  - ${task}`));
    console.log('================================\n');
    
    return state;
  }
  
  private getCurrentFile() {
    try {
      return execSync('git diff --name-only HEAD').toString().trim().split('\n')[0] || 'none';
    } catch {
      return 'none';
    }
  }
  
  private getGitStatus() {
    try {
      return execSync('git status --short').toString().trim();
    } catch {
      return 'no git repo';
    }
  }
  
  private getInstalledPackages() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    return Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    });
  }
  
  private getMigrationStatus() {
    try {
      return execSync('npx prisma migrate status').toString().trim();
    } catch {
      return 'no migrations';
    }
  }
  
  private getCurrentPhase() {
    const progress = fs.readFileSync('PROGRESS.md', 'utf-8');
    const match = progress.match(/\*\*Jelenlegi fázis\*\*: (.+)/);
    return match ? match[1] : 'Unknown';
  }
  
  private getCompletedTasks() {
    const progress = fs.readFileSync('PROGRESS.md', 'utf-8');
    const matches = progress.match(/✅ (.+)/g);
    return matches ? matches.map(m => m.replace('✅ ', '')) : [];
  }
  
  private getPendingTasks() {
    const progress = fs.readFileSync('PROGRESS.md', 'utf-8');
    const matches = progress.match(/\[ \] (.+)/g);
    return matches ? matches.map(m => m.replace('[ ] ', '')) : [];
  }
}

// CLI interface
const command = process.argv[2];
const recovery = new SessionRecovery();

switch (command) {
  case 'save':
    recovery.saveState();
    console.log('Session state saved.');
    break;
  case 'recover':
    recovery.recoverState();
    break;
  case 'start':
    recovery.recoverState();
    // Start auto-save interval
    setInterval(() => recovery.saveState(), 5 * 60 * 1000); // 5 minutes
    break;
  default:
    console.log('Usage: tsx session-recovery.ts [save|recover|start]');
}