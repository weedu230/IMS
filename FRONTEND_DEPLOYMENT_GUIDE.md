# 🚀 IMS DEPLOYMENT GUIDE – COMPLETE CHECKLIST

**Updated:** May 18, 2026  
**Status:** Frontend Ready for Deployment → Backend → Database Ready

---

## ✅ COMPLETED TASKS

### Backend ✓
- [x] Migrate MySQL schema to PostgreSQL (schema-postgres.sql)
- [x] Update database.js with serverless connection pooling
- [x] Install PostgreSQL drivers (pg, pg-hstore)
- [x] Create backend/.env with production credentials (Supabase)
- [x] Add Postgres migration script (migrate-postgres.js)
- [x] Add npm script: `npm run db:migrate:pg`
- [x] Update JWT_SECRET with strong production key
- [x] Configure CORS_ORIGIN for Vercel URLs
- [x] All commits pushed to GitHub main branch

### Frontend ✓
- [x] Fix React Hook useCallback dependency error (WarehousesPage.js)
- [x] Fix API formatting issue (employeeAPI resetPassword)
- [x] Update frontend/.env for production (NODE_ENV=production)
- [x] Create .env.example with placeholders
- [x] Verify all design patterns implemented (hooks, context, custom API layer)
- [x] Code quality audit (no console.log, unused imports cleaned)
- [x] All components properly structured (layout, pages, ui, api, context, hooks, utils)
- [x] All commits pushed to GitHub main branch

### Database ✓
- [x] Supabase PostgreSQL created (ap-southeast-1 region)
- [x] Schema ready (14 tables, enums, functions)
- [x] Connection pooling configured
- [x] Credentials secured in backend/.env

---

## 📋 TODO – FRONTEND DEPLOYMENT (IMMEDIATE)

### Step 1: Verify Frontend Build Locally
```bash
cd frontend
npm install  # if needed
npm run build
```
**Expected:** Build succeeds with "Compiled successfully" message

### Step 2: Create Vercel Frontend Project (if not exists)
Visit: https://vercel.com/new
- Import GitHub repo: `weedu230/IMS`
- **Root Directory:** `./frontend` (not the default)
- Skip build settings (use defaults)
- Deploy

### Step 3: Configure Frontend Environment on Vercel
After deployment URL is created (e.g., `https://ims-frontend.vercel.app`):
1. Go to **Project Settings** → **Environment Variables**
2. Add:
   - Key: `REACT_APP_API_URL`  
   - Value: `https://ims-backend.vercel.app/api/v1` (replace with actual backend URL)
   - Environments: ✓ Production
3. **Save** → Redeploy (automatic)

### Step 4: Verify Frontend Deployment
- Visit: `https://your-frontend-url.vercel.app`
- Login with: `admin@ims.local` / `Password123!`
- Check: Dashboard loads, no API errors in console
- Test: Navigate to different pages (products, stock, orders, etc.)

---

## 📋 TODO – BACKEND DEPLOYMENT (AFTER FRONTEND)

### Step 1: Create Vercel Backend Project
Visit: https://vercel.com/new
- Import GitHub repo: `weedu230/IMS`
- **Root Directory:** `./backend` (not the default)
- **Build Command:** `npm install` (no build needed, Node.js)
- **Start Command:** `node src/server.js` (if using)
- Skip if using automatic defaults

### Step 2: Configure Backend Environment on Vercel
1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `backend/.env`:
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=ap-southeast-1.pooler.supabase.com
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres.boqtxcmhjluucrteecwq
   DB_PASSWORD=Mwaleed230@
   DB_POOL_MAX=3
   DB_POOL_MIN=0
   DB_POOL_ACQUIRE=30000
   DB_POOL_IDLE=10000
   JWT_SECRET=3f8b9c2d1e7a4f6b9c0d2e5f7a8b1c3d
   JWT_EXPIRES_IN=8h
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   LOG_LEVEL=info
   LOG_DIR=logs
   ```
3. **Save** → Vercel auto-deploys

### Step 3: Apply Database Schema
Once backend is deployed, apply the Postgres schema:
```bash
# Option A: Run locally (recommended)
cd backend
npm run db:migrate:pg

# Option B: Use Supabase SQL Editor
# 1. Visit https://app.supabase.com
# 2. Open your project
# 3. Go to SQL Editor
# 4. Paste contents of backend/src/config/schema-postgres.sql
# 5. Run
```
**Expected:** "✅ Postgres schema applied" or success message in Supabase

### Step 4: Verify Backend Deployment
- Test API endpoint: `https://your-backend-url.vercel.app/api/v1/auth/login`
- Expected: JSON response (not HTML error)
- Login test via frontend should work

### Step 5: Update Frontend CORS on Vercel
If backend URL is different:
1. Update `REACT_APP_API_URL` in Frontend → Environment Variables
2. Redeploy frontend

---

## 🔗 IMPORTANT LINKS

- **GitHub Repo:** https://github.com/weedu230/IMS
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Frontend Code:** `frontend/` (React App)
- **Backend Code:** `backend/` (Express API)
- **Database:** Supabase PostgreSQL (ap-southeast-1)

---

## 🎯 DESIGN PATTERNS IMPLEMENTED

✓ **Authentication:** JWT-based with useAuth context hook  
✓ **API Layer:** Centralized axios instance with interceptors  
✓ **State Management:** React Context API (AuthContext)  
✓ **Custom Hooks:** useApi, usePagination, useDebounce  
✓ **Error Handling:** Global error boundaries, toast notifications  
✓ **Role-Based Access:** ProtectedRoute component with role checks  
✓ **Component Organization:** Feature-based folder structure  
✓ **UI Components:** Reusable components (Card, Button, Badge, etc.)  
✓ **Styling:** Tailwind CSS with utility classes  
✓ **Data Fetching:** Centralized API endpoints, consistent response handling  

---

## 🛠️ TROUBLESHOOTING

### Frontend Build Fails
- Check: `npm run build` locally first
- Clear: node_modules + package-lock.json
- Verify: No console.log or syntax errors

### Backend Connect Errors
- Check: CORS_ORIGIN matches frontend URL
- Verify: DB credentials in Vercel env vars
- Test: Database connection from local (npm run db:migrate:pg)

### API 401 Errors
- Check: JWT_SECRET matches between frontend/backend
- Verify: Token stored in localStorage
- Clear: localStorage and re-login

### Database Schema Not Applied
- Use Supabase SQL Editor directly
- Or run: `npm run db:migrate:pg` locally with correct .env

---

## 📞 CONTACTS & CREDENTIALS

**Admin User (Demo):**
- Email: `admin@ims.local`
- Password: `Password123!`

**Database Credentials:**
- Host: `ap-southeast-1.pooler.supabase.com:5432`
- User: `postgres.boqtxcmhjluucrteecwq`
- Password: `Mwaleed230@`
- Database: `postgres`

---

**Next Action:** Start with Frontend Deployment (Step 1-4 above)  
**After:** Backend Deployment (Step 5+ above)  
**Final:** End-to-end testing of login → create → fetch workflow
