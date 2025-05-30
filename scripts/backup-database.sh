#!/bin/bash

# Database backup script
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./database-backups"
mkdir -p $BACKUP_DIR

# Load environment variables
source .env

# Extract database info from DATABASE_URL
DB_URL=$DATABASE_URL
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

echo "Creating backup of database: $DB_NAME"
echo "Backup will be saved to: $BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Create backup
PGPASSWORD=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    ls -lh "$BACKUP_DIR/backup_${TIMESTAMP}.sql"
else
    echo "❌ Backup failed!"
    exit 1
fi