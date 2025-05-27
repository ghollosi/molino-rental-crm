#!/bin/bash
# start-session.sh

echo "🚀 Starting Molino Rental CRM Development Session"
echo "================================================"

# 1. Recovery check
echo "Checking previous session..."
npm run session:recover 2>/dev/null || echo "No previous session found"

# 2. Git status
echo -e "\nGit status:"
git status --short

# 3. Database check
echo -e "\nDatabase status:"
npx prisma migrate status 2>/dev/null || echo "Prisma not configured yet"

# 4. Dependencies check
echo -e "\nChecking dependencies..."
npm install

# 5. Show current status
npm run status 2>/dev/null || echo "Status script not configured yet"

# 6. Create daily checkpoint
CHECKPOINT_NAME="Daily_$(date +%Y%m%d)"
if [ ! -d ".checkpoints/$CHECKPOINT_NAME" ]; then
    echo -e "\nCreating daily checkpoint..."
    npm run checkpoint:create "Daily checkpoint" 2>/dev/null || echo "Checkpoint script not configured yet"
fi

# 7. Start dev server with auto-save
echo -e "\nStarting development server with auto-save..."
npm run dev &
DEV_PID=$!

# 8. Start auto-checkpoint (every 30 minutes)
while true; do
    sleep 1800
    npm run checkpoint:create "Auto-checkpoint" 2>/dev/null
done &
CHECKPOINT_PID=$!

# 9. Start session manager
npm run session:start 2>/dev/null &
SESSION_PID=$!

echo -e "\n✅ Session started successfully!"
echo "💡 Remember to check PROGRESS.md and CHANGELOG.md"
echo ""
echo "Process IDs:"
echo "  Dev Server: $DEV_PID"
echo "  Auto Checkpoint: $CHECKPOINT_PID"
echo "  Session Manager: $SESSION_PID"

# Wait for interrupt
wait