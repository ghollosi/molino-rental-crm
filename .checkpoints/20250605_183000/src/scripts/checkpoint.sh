#!/bin/bash
# src/scripts/checkpoint.sh

# Checkpoint létrehozása
create_checkpoint() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CHECKPOINT_DIR=".checkpoints/$TIMESTAMP"
    
    mkdir -p $CHECKPOINT_DIR
    
    # Állapot mentése
    echo "Creating checkpoint at $TIMESTAMP..."
    
    # Git commit
    git add -A
    git commit -m "CHECKPOINT: $TIMESTAMP - $1" || true
    
    # Fájlok másolása
    cp PROGRESS.md $CHECKPOINT_DIR/
    cp CHANGELOG.md $CHECKPOINT_DIR/
    cp .env.local $CHECKPOINT_DIR/ 2>/dev/null || true
    
    # Adatbázis dump
    DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-)
    pg_dump $DATABASE_URL > $CHECKPOINT_DIR/database.sql 2>/dev/null || true
    
    # Node modules lista
    npm list --depth=0 > $CHECKPOINT_DIR/npm-packages.txt
    
    # Jelenlegi állapot
    echo "{
        \"timestamp\": \"$TIMESTAMP\",
        \"description\": \"$1\",
        \"git_hash\": \"$(git rev-parse HEAD)\",
        \"branch\": \"$(git branch --show-current)\"
    }" > $CHECKPOINT_DIR/info.json
    
    echo "Checkpoint created successfully!"
}

# Checkpoint visszaállítása
restore_checkpoint() {
    CHECKPOINT=$1
    CHECKPOINT_DIR=".checkpoints/$CHECKPOINT"
    
    if [ ! -d "$CHECKPOINT_DIR" ]; then
        echo "Checkpoint not found: $CHECKPOINT"
        exit 1
    fi
    
    echo "Restoring checkpoint $CHECKPOINT..."
    
    # Git visszaállítás
    INFO=$(cat $CHECKPOINT_DIR/info.json)
    GIT_HASH=$(echo $INFO | jq -r '.git_hash')
    git checkout $GIT_HASH
    
    # Fájlok visszaállítása
    cp $CHECKPOINT_DIR/PROGRESS.md ./
    cp $CHECKPOINT_DIR/CHANGELOG.md ./
    [ -f "$CHECKPOINT_DIR/.env.local" ] && cp $CHECKPOINT_DIR/.env.local ./
    
    # Adatbázis visszaállítás
    DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-)
    psql $DATABASE_URL < $CHECKPOINT_DIR/database.sql 2>/dev/null || true
    
    # NPM csomagok ellenőrzése
    npm install
    
    echo "Checkpoint restored successfully!"
}

# Main
case "$1" in
    "create")
        create_checkpoint "$2"
        ;;
    "restore")
        restore_checkpoint "$2"
        ;;
    *)
        echo "Usage: $0 {create|restore} [description/checkpoint]"
        exit 1
        ;;
esac