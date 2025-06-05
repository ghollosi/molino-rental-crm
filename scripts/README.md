# Scripts Directory

This directory contains utility scripts for managing the Molino Rental CRM application.

## Available Scripts

### seed-production-admin.ts

Creates an admin user in the production database with proper error handling and security.

**Usage:**
```bash
# Create a new admin user
DATABASE_URL="postgresql://..." npx tsx scripts/seed-production-admin.ts

# Update password for existing admin user
UPDATE_PASSWORD=true DATABASE_URL="postgresql://..." npx tsx scripts/seed-production-admin.ts
```

**Features:**
- Creates admin user with email: `admin@molino.com` and password: `admin123`
- Handles cases where the user already exists
- Properly hashes passwords using bcrypt
- Works with databases that may or may not have the `lastName` column
- Provides clear feedback and error messages
- Hides database password in console output for security

**Admin User Properties:**
- Email: admin@molino.com
- Password: admin123 (hashed with bcrypt)
- First Name: Admin
- Last Name: User (if column exists)
- Role: ADMIN
- Language: HU
- Status: Active
- Phone: +36 1 234 5678

**Important Notes:**
- Always change the default password after first login
- The script uses raw SQL queries to handle database schema variations
- Make sure you have the correct DATABASE_URL for your production environment

### Other Scripts

- `create-test-providers.ts` - Creates test provider data
- `create-test-tenants.ts` - Creates test tenant data
- `generate-icons.js` - Generates PWA icons
- `deploy-to-vercel.sh` - Deployment script for Vercel
- `dev-server.sh` - Development server startup script
- `test-before-change.sh` - Pre-change testing script

## Security Considerations

1. Never commit scripts with hardcoded production database URLs
2. Always use environment variables for sensitive data
3. Change default passwords immediately after creation
4. Limit access to these scripts to authorized personnel only