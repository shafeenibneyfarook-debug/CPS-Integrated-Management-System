# Vercel Deployment Guide for CPS Management System

This guide explains step-by-step how to deploy the full-stack CPS Management System (React + Vite frontend, Express + MongoDB backend) to Vercel as a unified full-stack application.

---

## 🏗️ Architecture Overview

- **Frontend**: React 19 + Vite SPA built to `client/dist`. Vercel automatically serves all static assets across global CDN edge nodes.
- **Backend**: Express + Mongoose API serverless function located at `api/index.js` responding to `/api/*`.
- **Database**: MongoDB Atlas with connection caching across serverless invocations.
- **Routing**: `vercel.json` rewrites `/api/*` to the serverless function, and all frontend routes (e.g., `/dashboard`, `/projects`, `/shipments`, `/inventory`, `/boq-estimator`) to `/index.html` for client-side React Router.

---

## 📋 Prerequisites

1. **MongoDB Atlas Account**:
   - A free or paid cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - **Crucial Step**: In MongoDB Atlas, go to **Network Access** -> click **Add IP Address** -> select **Allow Access from Anywhere (`0.0.0.0/0`)**. This is required so Vercel's serverless lambdas can connect to your database.
2. **Vercel Account**: [vercel.com](https://vercel.com).
3. **Optional API Keys**:
   - `GROQ_API_KEY`: For AI BOQ structural estimations.
   - `FIRECRAWL_API_KEY`: For real-time price scraping.

---

## 🔑 Environment Variables to Configure in Vercel

When creating the project on Vercel (or in **Settings** ➡️ **Environment Variables**), add the following:

| Variable Name | Required | Example / Description |
| :--- | :--- | :--- |
| `MONGO_URI` | **Yes** | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/cps_db?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | A strong random string (e.g., `cps_secret_production_key_2026!`) |
| `FIRECRAWL_API_KEY` | Optional | `your_firecrawl_api_key_here` (for price scraping) |
| `GROQ_API_KEY` | Optional | `your_groq_api_key_here` (for Groq AI BOQ estimator) |
| `NODE_ENV` | Optional | `production` |

> 💡 **Note on `VITE_API_URL`**: Since both frontend and backend are deployed together in the same Vercel project, frontend requests use the relative `/api` path by default. You do **not** need to set `VITE_API_URL` unless you are hosting your backend on a completely separate domain.

---

## 🚀 Deployment Methods

### Method 1: Deploy via GitHub (Recommended)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure project for Vercel deployment"
   git push origin main
   ```
2. Log into [Vercel Dashboard](https://vercel.com).
3. Click **Add New...** ➡️ **Project**.
4. Import your GitHub repository (`CPS_Full`).
5. In the **Configure Project** screen:
   - **Framework Preset**: Vite (detected automatically).
   - **Root Directory**: `./` (leave at root).
   - **Build and Output Settings**: Leave as default (`vercel.json` handles this automatically).
   - **Environment Variables**: Add `MONGO_URI`, `JWT_SECRET`, and optional keys from the table above.
6. Click **Deploy**.

---

### Method 2: Deploy via Vercel CLI

1. Install Vercel CLI globally (if not already installed):
   ```bash
   npm i -g vercel
   ```
2. Run deployment from the root directory:
   ```bash
   vercel
   ```
3. Set your environment variables via CLI or in the dashboard, then deploy to production:
   ```bash
   vercel --prod
   ```

---

## 🧪 Post-Deployment Verification Checklist

After deployment, verify the following:

- [ ] **API Health Check**: Visit `https://<your-app>.vercel.app/api/health` — it should return:
  ```json
  {
    "status": "ok",
    "service": "CPS Management System API",
    "dbState": 1,
    "timestamp": "..."
  }
  ```
  *(Note: `dbState: 1` confirms MongoDB is successfully connected).*
- [ ] **Public Landing**: Visit `https://<your-app>.vercel.app/`
- [ ] **Authentication**: Register a new user or login at `/login`.
- [ ] **SPA Direct URL Refresh**: Navigate to `/projects`, `/shipments`, `/inventory`, or `/boq-estimator` and press browser refresh (F5/Cmd+R) to verify client-side routing rewrites work properly without 404s.
- [ ] **All Features**:
  - Client Management (`/clients`)
  - Supplier Management (`/suppliers`)
  - Project Tracking & Maps (`/projects`)
  - Shipment Tracking (`/shipments`)
  - Quotations & Purchase Orders (`/quotations`, `/purchase-orders`)
  - Invoices & Inventory (`/invoices`, `/inventory`)
  - Import Cost Calculator (`/import-costs`)
  - Price Scraper (`/price-scraper`)
  - BOQ Estimator (`/boq-estimator`)
  - Product Recommendations (`/product-recommendations`)

---

## 🛠️ Local Development

To run the full stack locally:

```bash
# Install all dependencies (root, client, server)
npm install

# Start both backend and frontend concurrently
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001`
- Health Check: `http://localhost:5001/api/health`
