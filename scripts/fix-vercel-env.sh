#!/bin/bash

echo "🔧 Fixing Vercel environment variables..."

# Note: You need to run these commands manually in Vercel dashboard
# or install Vercel CLI: npm i -g vercel

echo "📋 Environment variables to set in Vercel dashboard:"
echo ""
echo "NEXTAUTH_URL=https://molino-rental-crm-production.vercel.app"
echo "NEXT_PUBLIC_APP_URL=https://molino-rental-crm-production.vercel.app"
echo ""
echo "🌐 Go to: https://vercel.com/dashboard"
echo "1. Select your project: molino-rental-crm"
echo "2. Go to Settings → Environment Variables"
echo "3. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL"
echo "4. Redeploy the project"
echo ""
echo "📧 Admin login after fix:"
echo "Email: admin@molino.com"
echo "Password: admin123"