# Backup Information - Molino Rental CRM

**Backup Date**: 2025-05-29
**Reason**: Organizing duplicate files found in the project

## What's in this backup:

### 1. `/src-app/` - Old application directory
- Contains the older version of the app directory from `/src/app/`
- The main `/app/` directory is the currently active version
- This backup contains simpler/older implementations

### 2. `/logs/` - Development log files
- Various development log files (next-dev.log, dev-output.log, etc.)
- These are temporary files that can be safely deleted if not needed

### 3. `/docs/` - Old documentation files
- Old SESSION_LOG_*.md files
- Old CHECKPOINT_*.md files
- These contain historical development information

### 4. `/configs/` - Duplicate configuration files
- `postcss.config.js` - Old PostCSS config (using .mjs now)
- `auth-root.ts` - Copy of /auth.ts
- `auth-src.ts` - Copy of /src/auth.ts

### 5. `/components/` - Old component versions
- `dashboard-stats.tsx` - Simpler version (using enhanced version now)

## How to restore:

If you need any of these files back:
```bash
# To restore a specific file:
cp backup-duplicates/[path-to-file] [original-location]

# To restore entire directories:
cp -r backup-duplicates/src-app/* src/app/
```

## Note:
The active, working version of the application uses:
- `/app/` directory (NOT `/src/app/`)
- `postcss.config.mjs` (NOT `.js`)
- `enhanced-dashboard-stats.tsx` (NOT `dashboard-stats.tsx`)
- `/src/lib/auth.ts` as the main auth configuration

These backups are kept for safety but the project should work without them.