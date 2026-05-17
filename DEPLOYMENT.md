# IMS Pro - Free Deployment Guide

Deploy your IMS Pro application for free using Vercel (frontend + backend) and PlanetScale (database).

## Architecture Overview

```
┌─────────────────┐
│  Vercel         │
│ ├─ Frontend     │  (React SPA)
│ └─ Backend API  │  (Node.js Serverless)
└────────┬────────┘
         │
         └──→ PlanetScale (MySQL)
```

---

## Step 1: Set Up PlanetScale Database (5 min)

### 1.1 Create PlanetScale Account
- Go to https://planetscale.com
- Sign up with GitHub (recommended for easy deployment linking)
- Verify email

### 1.2 Create Database
- Dashboard → Create New Database
- Name: `ims-pro` (or any name)
- Region: closest to your users
- Plan: **Free** (Hobby plan)
- Click "Create database"

### 1.3 Create Connection String
- Go to database → Branches → `main`
- Click "Connect" button
- Choose "Nodejs" tab
- Copy the connection string (looks like):
  ```
  mysql://username:password@host.mysql.databases.cloud/database?sslaccept=strict
  ```
- **Save this somewhere safe** — you'll need it for Vercel

### 1.4 Run Migrations
Local migration (run once):
```bash
cd backend
mysql -h "host-from-connection-string" -u "username" -p "password" -D "database_name" < src/config/schema.sql
```

Or use your local MySQL client to copy the schema.sql content into PlanetScale's web console.

---

## Step 2: Deploy Backend to Vercel (10 min)

### 2.1 Prepare Backend for Serverless
- Already done! (`backend/src/config/database.js` reuses global connection)
- Backend uses Serverless Functions via Express (Vercel adapts it automatically)

### 2.2 Push to GitHub
```bash
cd "D:\Projects\claude ims\ims"
git add .
git commit -m "deploy: add Vercel configs for backend and frontend"
git push origin main
```

### 2.3 Deploy to Vercel
- Go to https://vercel.com
- Sign in with GitHub
- Click "New Project"
- Select `weedu230/IMS` repository
- **Root Directory:** `backend`
- **Build Command:** `npm install` (Vercel auto-detects)
- **Install Command:** `npm install`
- **Start Command:** (leave empty for serverless)
- Click "Environment Variables" and add:

  | Key | Value |
  |-----|-------|
  | `NODE_ENV` | `production` |
  | `DB_HOST` | From PlanetScale connection string |
  | `DB_PORT` | `3306` |
  | `DB_NAME` | From PlanetScale connection string |
  | `DB_USER` | From PlanetScale connection string |
  | `DB_PASSWORD` | From PlanetScale connection string |
  | `DB_POOL_MAX` | `3` |
  | `DB_POOL_MIN` | `0` |
  | `DB_POOL_ACQUIRE` | `30000` |
  | `DB_POOL_IDLE` | `10000` |
  | `JWT_SECRET` | Generate a random 32+ char string |
  | `CORS_ORIGIN` | `https://your-frontend-vercel-url.vercel.app` (add after frontend is deployed) |

- Click "Deploy"
- Wait 2-3 minutes
- Your backend URL: `https://your-project-name.vercel.app/api`

### 2.4 Copy Backend URL
- Once deployed, Vercel shows your URL (e.g., `https://ims-pro-backend.vercel.app`)
- Copy this — you'll need it for frontend

---

## Step 3: Deploy Frontend to Vercel (10 min)

### 3.1 Create New Vercel Project for Frontend
- Go to https://vercel.com → New Project
- Select `weedu230/IMS` repository again
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Environment Variables:**

  | Key | Value |
  |-----|-------|
  | `REACT_APP_API_URL` | `https://ims-pro-backend.vercel.app/api` (from Step 2.4) |

- Click "Deploy"
- Wait 2-3 minutes
- Your frontend URL: `https://your-frontend.vercel.app`

### 3.2 Update Backend CORS
- Go back to Backend Vercel project
- Settings → Environment Variables
- Update `CORS_ORIGIN` to your new frontend URL
- Click "Redeploy" to apply changes

---

## Step 4: Test Deployment

### 4.1 Test Backend API
```bash
# In PowerShell:
$backendUrl = "https://your-backend.vercel.app/api"
$testUrl = "$backendUrl/auth/health"  # or your health check endpoint

Invoke-WebRequest -Uri $testUrl
```

Expected: `200 OK` response

### 4.2 Test Frontend
- Visit `https://your-frontend.vercel.app`
- Login with your test credentials
- Try creating a product or checking dashboard
- Monitor Vercel logs for errors

### 4.3 Monitor Logs
- **Backend logs:** Vercel project → Functions tab → view logs
- **Frontend logs:** Vercel project → Deployments tab → click deployment → Logs
- **Database logs:** PlanetScale dashboard → Insights tab

---

## Troubleshooting

### Issue: `Database connection failed`
- **Check:** PlanetScale connection string is correct in Vercel env vars
- **Check:** Firewall/SSL settings (PlanetScale requires SSL in production)
- **Fix:** Ensure `NODE_ENV=production` and `dialectOptions.ssl` is enabled

### Issue: `CORS Error` or API calls fail
- **Check:** `CORS_ORIGIN` env var matches your frontend URL exactly
- **Check:** Frontend is using correct `REACT_APP_API_URL`
- **Fix:** Re-deploy both projects after updating env vars

### Issue: Serverless Function Timeout
- **Check:** Database queries are slow (check PlanetScale console)
- **Check:** Connection pool is exhausted (max open connections)
- **Fix:** Reduce `DB_POOL_MAX` to 2-3, increase `DB_POOL_IDLE` timeout

### Issue: "Too Many Connections" error
- **Root cause:** Serverless functions aren't reusing connections properly
- **Check:** Backend database.js uses global `__sequelize` instance
- **Fix:** Ensure `backend/src/config/database.js` has the `getSequelize()` function

---

## Next Steps (Optional)

### Add Custom Domain
- Vercel → Project Settings → Domains
- Add your custom domain
- Follow DNS instructions

### Enable Database Branching (PlanetScale)
- Great for development/staging
- Create a branch, test changes, merge to production

### Set Up CI/CD Monitoring
- Vercel auto-deploys on push to main
- PlanetScale integrates with Vercel for safe migrations

### Scale Up (Paid)
- Vercel Pro: $20/month (more serverless compute)
- PlanetScale Pro: $29/month (more storage, higher limits)

---

## Environment Variables Cheat Sheet

**Backend (`.env`):**
```
NODE_ENV=production
PORT=3001
DB_HOST=<from-planetscale>
DB_PORT=3306
DB_NAME=<from-planetscale>
DB_USER=<from-planetscale>
DB_PASSWORD=<from-planetscale>
JWT_SECRET=<generate-random-32-chars>
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Frontend (`.env`):**
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

---

## Free Tier Limits

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Vercel** | Hobby | 100GB bandwidth/month, unlimited deployments |
| **Vercel Serverless** | Hobby | 6000 hours/month, 10 concurrent invocations |
| **PlanetScale** | Hobby | 5GB storage, 1 billion row reads/month |

For a semester project, this is plenty. Scale up only if needed.

---

## Questions?

- **Vercel Docs:** https://vercel.com/docs
- **PlanetScale Docs:** https://planetscale.com/docs
- **Sequelize Serverless:** https://sequelize.org/docs/other-topics/other-databases/#serverless
