# 🛠️ MOLINO RENTAL CRM - HIBAELHÁRÍTÁSI ÚTMUTATÓ
**Utolsó frissítés:** 2025-06-03

## 🚨 KRITIKUS HIBÁK ÉS MEGOLDÁSOK

### 1. Next.js 15 Params Promise Error
**Hiba:**
```
Error: Cannot access params.id directly in Next.js 15+
Property 'id' does not exist on type 'Promise<{ id: string }>'
```

**Megoldás:**
```typescript
// ❌ HIBÁS (régi Next.js)
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id
}

// ✅ HELYES (Next.js 15+)
import { use } from 'react'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
}
```

**Érintett fájlok:**
- `app/dashboard/tenants/[id]/page.tsx` ✅ JAVÍTVA
- `app/dashboard/properties/[id]/page.tsx` ✅ JAVÍTVA
- Minden dynamic route page

---

### 2. Calendar Click Events Not Working
**Hiba:**
- PropertyCalendar click events nem működnek
- onDateClick nem triggerel

**Megoldás:**
```typescript
// ❌ HIBÁS komponens
import { PropertyCalendar } from '@/components/property/property-calendar'

// ✅ HELYES komponens használata
import { SimplePropertyCalendar } from '@/components/property/simple-property-calendar'

<SimplePropertyCalendar propertyId={propertyId} />
```

**Státusz:**
- PropertyCalendar: ❌ DEPRECATED
- SimplePropertyCalendar: ✅ WORKING

---

### 3. React Duplicate Key Warning
**Hiba:**
```
Warning: Encountered two children with the same key, `Sz`
```

**Megoldás:**
```typescript
// ❌ HIBÁS (duplicate keys)
{['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map((day) => (
  <div key={day}>{day}</div>
))}

// ✅ HELYES (unique keys)
{['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((day, index) => (
  <div key={`${day}-${index}`}>{day}</div>
))}
```

---

### 4. Database Connection Issues
**Hiba:**
```
PrismaClientInitializationError: Can't reach database server
```

**Ellenőrzés:**
```bash
# 1. Database URL check
echo $DATABASE_URL

# 2. Prisma connection test
npx prisma db pull

# 3. Reset if needed
npx prisma migrate reset
npx prisma db push
```

**Gyakori okok:**
- Hibás DATABASE_URL
- Database szerver leállt
- Network kapcsolat probléma
- Prisma schema és database eltérés

---

### 5. tRPC Import Errors
**Hiba:**
```
Module not found: Can't resolve '@/lib/trpc'
```

**Megoldás:**
```typescript
// ✅ HELYES import pattern
import { api } from '@/lib/trpc/client'  // Client komponensekhez
import { api } from '@/lib/trpc'         // Server komponensekhez
```

**Ellenőrzendő fájlok:**
- `src/lib/trpc/client.ts`
- `src/lib/trpc/server.ts`
- `tsconfig.json` paths konfiguráció

---

### 6. File Upload R2 Errors
**Hiba:**
```
S3ServiceException: The request signature we calculated does not match
```

**Ellenőrzés:**
```bash
# Environment variables
echo $CLOUDFLARE_R2_ACCESS_KEY_ID
echo $CLOUDFLARE_R2_SECRET_ACCESS_KEY
echo $CLOUDFLARE_R2_BUCKET_NAME
echo $CLOUDFLARE_R2_ENDPOINT
```

**Gyakori okok:**
- Hibás AWS credentials
- Bucket permissions
- Endpoint URL format hiba
- File size limit

---

## 🔧 ÁLTALÁNOS HIBÁK

### Build Errors

#### TypeScript Compilation Errors
```bash
# Type check
npm run type-check

# Build with detailed errors
npm run build -- --debug
```

#### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Prisma Schema Sync Issues
```bash
# Reset database
npx prisma migrate reset

# Push schema changes
npx prisma db push

# Generate client
npx prisma generate
```

---

### Runtime Errors

#### Server Component Errors
**Hiba:** Hooks used in Server Component

**Megoldás:**
```typescript
// Server Component - NO hooks
export default function ServerPage() {
  // No useState, useEffect, etc.
  return <div>Server content</div>
}

// Client Component - hooks OK
'use client'
export default function ClientPage() {
  const [state, setState] = useState()
  return <div>Client content</div>
}
```

#### Hydration Mismatch
**Hiba:** Text content does not match server-rendered HTML

**Gyakori okok:**
- Date/time rendering eltérés
- Random content generation
- Browser-specific API használat
- Conditional rendering

**Megoldás:**
```typescript
// ❌ HIBÁS
const randomId = Math.random()

// ✅ HELYES
const [randomId, setRandomId] = useState<number>()
useEffect(() => {
  setRandomId(Math.random())
}, [])
```

---

### 3. NextAuth Session Custom Fields Not Appearing
**Hiba:** 
- Session-ben csak az alapmezők jelennek meg (email, id, role, language)
- firstName, lastName, phone mezők hiányoznak
- Dashboard "Üdvözöljük, admin!" helyett teljes név kellene

**Megoldás:** tRPC getCurrentUser endpoint használata
```typescript
// ❌ HIBÁS - NextAuth session custom fields nem működnek
{session.user.firstName} {session.user.lastName}

// ✅ HELYES - tRPC-vel lekérjük az adatbázisból
const { data: currentUser } = api.user.getCurrentUser.useQuery()
const displayName = currentUser 
  ? `${currentUser.firstName} ${currentUser.lastName}`.trim() 
  : session.user.email?.split('@')[0]
```

**Érintett fájlok:**
- `app/dashboard/page.tsx` ✅ JAVÍTVA
- `app/dashboard/settings/page.tsx` ✅ JAVÍTVA
- `src/server/routers/user.ts` - getCurrentUser endpoint hozzáadva

---

### Database Issues

#### Migration Conflicts
```bash
# Reset migrations
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name describe_change

# Deploy to production
npx prisma migrate deploy
```

#### Seed Data Problems
```bash
# Run seed
npx prisma db seed

# Custom seed
npx tsx prisma/seed.ts
```

#### Connection Pool Exhaustion
**Megoldás:** Connection pooling limits

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

---

## 🔄 FEJLESZTŐI KÖRNYEZET HIBÁK

### Port Already in Use
```bash
# Find process on port 3333
lsof -ti:3333

# Kill process
kill -9 $(lsof -ti:3333)

# Or use different port
npm run dev -- -p 3334
```

### Package Version Conflicts
```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Fix vulnerabilities
npm audit fix
```

### Git Issues
```bash
# Unstage all changes
git reset HEAD .

# Discard changes
git checkout -- .

# Reset to last commit
git reset --hard HEAD

# Clean untracked files
git clean -fd
```

---

## 📱 FRONTEND HIBÁK

### Component Not Rendering
**Ellenőrzés:**
1. Import statement helyes?
2. Export statement helyes?
3. Component neve egyezik?
4. Props típusok helyesek?

```typescript
// ✅ HELYES pattern
export function ComponentName(props: Props) {
  return <div></div>
}

// Import
import { ComponentName } from './path'
```

### Styling Issues
**CSS nem működik:**
1. Tailwind CSS classes helyesek?
2. Custom CSS importálva?
3. CSS precedence conflict?

```bash
# Rebuild Tailwind
npm run build:css
```

### State Not Updating
**Gyakori okok:**
1. State mutation instead of replacement
2. Stale closure in useEffect
3. Missing dependency array

```typescript
// ❌ HIBÁS (mutation)
const addItem = () => {
  items.push(newItem)
  setItems(items)
}

// ✅ HELYES (replacement)
const addItem = () => {
  setItems([...items, newItem])
}
```

---

## 🗄️ BACKEND HIBÁK

### tRPC Procedure Errors
**Authorization Error:**
```typescript
// ✅ Protected procedure használata
export const protectedProcedure = createTRPCRouter({
  create: protectedProcedure
    .input(schema)
    .mutation(async ({ input, ctx }) => {
      // ctx.user available here
    })
})
```

**Validation Errors:**
```typescript
// Zod schema validation
const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email")
})
```

### Database Query Optimization
**Slow queries:**
```typescript
// ❌ N+1 query problem
const users = await ctx.db.user.findMany()
const userWithPosts = await Promise.all(
  users.map(user => 
    ctx.db.post.findMany({ where: { userId: user.id } })
  )
)

// ✅ Include relation
const usersWithPosts = await ctx.db.user.findMany({
  include: { posts: true }
})
```

---

## 🛡️ SECURITY ISSUES

### Authentication Problems
**Session not persisting:**
1. NextAuth configuration
2. Database session table
3. Cookie settings

```typescript
// next-auth config
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
}
```

### File Upload Security
**Validation checks:**
```typescript
// File type validation
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type')
}

// File size validation
const maxSize = 5 * 1024 * 1024 // 5MB
if (file.size > maxSize) {
  throw new Error('File too large')
}
```

---

## 🚀 PRODUCTION HIBÁK

### Deployment Issues (Vercel)
**Build failures:**
```bash
# Local build test
npm run build

# Check build logs
vercel logs
```

**Environment variables:**
1. Vercel dashboard settings
2. All required vars present
3. Production vs preview environments

### Performance Issues
**Slow page loads:**
1. Bundle size analysis
2. Image optimization
3. Database query optimization
4. CDN caching

```bash
# Bundle analyzer
npm run analyze

# Lighthouse audit
npm run lighthouse
```

---

## 🔄 GYORS JAVÍTÁSI LÉPÉSEK

### 1. Teljes Reset (Nuclear Option)
```bash
# Stop all processes
pkill -f "next"

# Clean everything
rm -rf node_modules package-lock.json .next
git reset --hard HEAD
git clean -fd

# Fresh install
npm install
npm run build
npm run dev
```

### 2. Database Reset
```bash
npx prisma migrate reset
npx prisma db push
npx prisma db seed
```

### 3. Development Server Reset
```bash
# Kill port
kill -9 $(lsof -ti:3333)

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### 4. Git Recovery
```bash
# Save current work
git stash

# Return to known good state
git checkout 43b1091  # Last known good commit

# Apply stashed changes if needed
git stash pop
```

---

## 📞 EMERGENCY PROCEDURES

### 1. Production Down
1. Check Vercel status
2. Rollback to previous deployment
3. Check database connectivity
4. Verify environment variables

### 2. Data Loss Risk
1. Immediate database backup
2. Stop all write operations
3. Investigate data integrity
4. Restore from backup if needed

### 3. Security Breach
1. Revoke all API keys
2. Reset user passwords
3. Check audit logs
4. Update security measures

---

## 📋 DIAGNOSTIC CHECKLIST

### Before Asking for Help:
- [ ] Error message másolva
- [ ] Reprodukálható lépések
- [ ] Environment (dev/prod)
- [ ] Browser/device info
- [ ] Recent changes noted
- [ ] Console logs captured
- [ ] Network tab checked

### Information to Provide:
1. **Exact error message**
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Environment details**
5. **Recent changes**
6. **Screenshots/videos**

---

**🔗 Kapcsolódó dokumentumok:**
- [Backup Snapshot](./BACKUP_SNAPSHOT_2025.md)
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Component Guide](./COMPONENT_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)

**🆘 Emergency Commands:**
```bash
git reset --hard HEAD          # Reset all changes
npm run dev -- --port 3334     # Different port
npx prisma migrate reset       # Reset database
rm -rf node_modules && npm i    # Clean install
```