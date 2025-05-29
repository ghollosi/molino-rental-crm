# Production Deployment Checklist - Molino RENTAL CRM

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup ✅
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Set all required environment variables:
  - [ ] `DATABASE_URL` - PostgreSQL connection string with pooling
  - [ ] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
  - [ ] `NEXTAUTH_URL` - Your production domain
  - [ ] `NEXT_PUBLIC_APP_URL` - Your production domain
  - [ ] `RESEND_API_KEY` - Get from https://resend.com
  - [ ] `UPLOADTHING_SECRET` & `UPLOADTHING_APP_ID` - Get from https://uploadthing.com
  - [ ] `SENTRY_DSN` - Get from https://sentry.io (optional)

### 2. Database Setup
- [ ] Create production PostgreSQL database
- [ ] Enable connection pooling (PgBouncer or similar)
- [ ] Run migrations:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Seed initial admin user:
  ```bash
  npx tsx prisma/seed.ts
  ```
- [ ] Set up automated backups

### 3. Security Checks ✅
- [ ] Environment variables are secure
- [ ] Security headers implemented (middleware.ts)
- [ ] Rate limiting configured
- [ ] CORS settings appropriate
- [ ] Remove all console.log statements
- [ ] Disable source maps in production

### 4. Build & Test
- [ ] Run production build locally:
  ```bash
  npm run build
  npm start
  ```
- [ ] Test all critical paths:
  - [ ] Login/Logout
  - [ ] Create/Edit/Delete Property
  - [ ] Create/Edit Issue
  - [ ] User Management (Admin only)
  - [ ] PDF/Excel Export
  - [ ] Email notifications
- [ ] Check for TypeScript errors:
  ```bash
  npm run typecheck
  ```
- [ ] Run linter:
  ```bash
  npm run lint
  ```

### 5. Performance Optimization ✅
- [ ] Image optimization enabled
- [ ] Database queries optimized (connection pooling)
- [ ] Static assets cached
- [ ] PWA manifest configured
- [ ] Service Worker functioning

### 6. Monitoring Setup
- [ ] Sentry error tracking configured
- [ ] Database monitoring (connection pool metrics)
- [ ] Uptime monitoring
- [ ] Performance monitoring

## 📦 Deployment Options

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Set environment variables in Vercel dashboard
4. Connect to GitHub for auto-deployments

### Option 2: Railway
1. Install Railway CLI: `npm i -g @railway/cli`
2. Run: `railway login` then `railway up`
3. Set environment variables in Railway dashboard
4. Database included in Railway

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)
1. Set up Node.js 18+ environment
2. Install PM2: `npm i -g pm2`
3. Build: `npm run build`
4. Start: `pm2 start npm --name "molino-crm" -- start`
5. Set up Nginx reverse proxy
6. Configure SSL with Let's Encrypt

### Option 4: Docker
1. Build image:
   ```bash
   docker build -t molino-crm .
   ```
2. Run container:
   ```bash
   docker run -p 3000:3000 --env-file .env.production molino-crm
   ```

## 🏁 Post-Deployment Checklist

### Immediate Tasks
- [ ] Verify application is accessible
- [ ] Test login with admin credentials
- [ ] Check all environment variables loaded correctly
- [ ] Verify database connection
- [ ] Test email sending
- [ ] Check error monitoring (trigger test error)
- [ ] Verify SSL certificate

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify backup system
- [ ] Test all critical features
- [ ] Monitor database connections
- [ ] Check rate limiting

### First Week
- [ ] Review Sentry errors
- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed
- [ ] Gather user feedback
- [ ] Plan first updates

## 🆘 Rollback Plan

If issues arise:
1. Keep previous version accessible
2. Database backup before migration
3. Environment variables backed up
4. Quick rollback process:
   ```bash
   # Vercel
   vercel rollback
   
   # Railway
   railway rollback
   
   # VPS
   pm2 reload molino-crm --update-env
   ```

## 📝 Important Notes

1. **Database**: Always backup before deployment
2. **Secrets**: Never commit `.env.production`
3. **Testing**: Test in staging environment first
4. **Monitoring**: Set up alerts for errors
5. **Documentation**: Keep deployment process documented

## 🔐 Security Reminders

- Change default admin password immediately
- Enable 2FA for production database
- Set up firewall rules
- Regular security updates
- Monitor for suspicious activity

## 📧 Support Contacts

- Database issues: [Your DB provider support]
- Hosting issues: [Your hosting provider support]
- Application issues: Check Sentry dashboard
- Email issues: Resend dashboard

---

**Last Updated**: 2025-05-29
**Version**: 1.0.0
**Status**: READY FOR DEPLOYMENT 🚀