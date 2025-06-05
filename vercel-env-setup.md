# VERCEL ENVIRONMENT VARIABLES - BULK SETUP

## 🚀 **GYORS BEÁLLÍTÁS - MÁSOLD BE EGYSZERŰEN**

### **Vercel Dashboard Steps:**
1. Menj a **Vercel Dashboard**: https://vercel.com/dashboard
2. Válaszd ki a **molino-rental-crm** projektet
3. **Settings** → **Environment Variables**
4. Kattints **"Bulk Edit"** gombra
5. Másold be az alábbi teljes konfigurációt:

---

## 📋 **BULK ENVIRONMENT VARIABLES (Másold be Vercel-be):**

```env
DATABASE_URL=postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
NEXTAUTH_URL=https://molino-rental-crm.vercel.app
NEXTAUTH_SECRET=molino_rental_crm_production_secret_2025_very_secure_key_for_jwt_tokens
R2_ACCESS_KEY_ID=062db13eb2d227445539332b737c5c41
R2_SECRET_ACCESS_KEY=27b5077b94cc85ab79adb43495af8edb78fd40a85d7b3770c21a36d9e9c5a2b2
R2_BUCKET_NAME=molino-rental
R2_ENDPOINT=https://cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com
RESEND_API_KEY=re_YUHrniX6_PAbF5mXFSUqJK86DoYS8haeF
EMAIL_FROM=noreply@molino-rental.com
NEXT_PUBLIC_APP_URL=https://molino-rental-crm.vercel.app
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## ⚙️ **ENVIRONMENT SETTINGS:**
- **Environment:** ✅ Production ✅ Preview ✅ Development (mind a hármat jelöld be)
- **Region:** Europe (fra1) - automatikus
- **Node.js Version:** 18.x vagy újabb

---

## 🔧 **BUILD SETTINGS (Vercel projekt beállításokban):**

### **General Settings:**
- **Framework Preset:** Next.js
- **Root Directory:** ./
- **Node.js Version:** 18.x
- **Package Manager:** npm

### **Build & Output Settings:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

---

**🚀 READY FOR PRODUCTION! 🇪🇸🏖️**