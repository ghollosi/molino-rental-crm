# Vercel Environment Variables Checklist

Ellenőrizd a Vercel Dashboard-ban (Settings → Environment Variables), hogy ezek be vannak-e állítva:

## Kötelező változók:

1. **DATABASE_URL**
   ```
   postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **NEXTAUTH_SECRET**
   ```
   KwC1EiZx4K5F/KajnbSi/xyaGj93rYwwaQyd77KfeR4=
   ```

3. **NEXTAUTH_URL**
   ```
   https://molino-rental-crm-production.vercel.app
   ```

4. **NEXT_PUBLIC_APP_URL**
   ```
   https://molino-rental-crm-production.vercel.app
   ```

## Opcionális változók:

5. **RESEND_API_KEY** (email küldéshez)
   ```
   re_YUHrniX6_PAbF5mXFSUqJK86DoYS8haeF
   ```

6. **R2_*** változók (fájl feltöltéshez)

## FONTOS:
- Minden változó Production environment-re legyen beállítva
- A változók értékei pontosan egyezzenek (nincs extra space vagy idézőjel)
- Ha módosítasz, mindig Redeploy szükséges!# Trigger redeploy Thu May 29 18:43:12 CEST 2025
# Force redeploy Thu May 29 18:57:34 CEST 2025
# URGENT: Force deploy for working owner form Thu May 29 20:11:00 CEST 2025
# Force redeploy Thu May 29 19:48:36 CEST 2025
