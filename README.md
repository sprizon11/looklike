# Look Like — Ladies Wear Boutique

Single-service deployment: Node.js API + React storefront.

## Local development

```bash
# Terminal 1 — API
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
cd app
npm install
npm run dev
```

Set `app/.env` with `VITE_API_BASE_URL=http://localhost:8080` for local API calls.

## Production build (same as Render)

```bash
npm run build
npm start
```

Open `http://localhost:8080`

## Deploy on Render

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** (or Web Service connected to repo).
3. Use `render.yaml` or configure manually:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Environment variables:**
     - `FRONTEND_DIST_DIR` = `./app/dist`
     - `DATA_DIR` = `./backend/data`
4. For persistent products/orders across deploys, add a **Render Disk** mounted at `/opt/render/project/src/backend/data` and set `DATA_DIR` to that path.

Online payment (Razorpay) is optional and can be enabled later by adding `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Render.

Admin: `https://your-app.onrender.com/#/admin` (password: `admin123` — change in `app/src/pages/Admin.tsx` before going live).
