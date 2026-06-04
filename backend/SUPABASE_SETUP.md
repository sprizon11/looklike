# Supabase setup (free — keeps products & orders on Render free tier)

Your shop stores **products**, **orders**, and **payment screenshots** in [Supabase](https://supabase.com) (free cloud database). Render only runs the website; data survives restarts.

## 1. Create a Supabase project (free)

1. Go to [https://supabase.com](https://supabase.com) and sign up (free).
2. Click **New project**.
3. Pick a name (e.g. `looklike`), set a database password, choose a region close to India if available.
4. Wait until the project is ready (~2 minutes).

## 2. Create tables

1. In Supabase: **SQL Editor** → **New query**.
2. Open `backend/supabase/schema.sql` from this repo, copy all of it, paste into the editor.
3. Click **Run**. You should see “Success”.

## 3. Create storage bucket (payment screenshots)

If the SQL did not create the bucket:

1. **Storage** → **New bucket**
2. Name: `payment-proofs`
3. **Public bucket**: OFF (private)
4. Create

## 4. Get API keys for Render

1. **Project Settings** (gear) → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`  
     ⚠️ Never put the service role key in the frontend or GitHub. Only on Render env vars.

## 5. Add env vars on Render

Render dashboard → **looklike** service → **Environment**:

| Key | Value |
|-----|--------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (service_role key) |

Keep your existing vars (`UPI_ID`, `FRONTEND_DIST_DIR`, etc.).

Click **Save Changes** → **Manual Deploy** (or push to GitHub if auto-deploy is on).

## 6. Check it works

1. Open `https://looklike-rz65.onrender.com/health`  
   Should show: `"store": "supabase"`
2. Admin → add a product → refresh tomorrow → product should still be there.
3. Place a test order with payment screenshot → check **Admin → Orders**.

## Local development

Copy `backend/.env.example` to `backend/.env` and add the same Supabase vars.  
Without them, the app uses local JSON files in `backend/data` (fine for testing on your PC).

## Free tier limits (typical)

- 500 MB database — plenty for product catalog + orders
- 1 GB file storage — payment screenshots
- Pauses after 1 week inactive on Supabase free — project wakes on next API call

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `/health` shows `"store": "json-files"` | Supabase env vars missing on Render — add and redeploy |
| “relation products does not exist” | Run `schema.sql` in SQL Editor |
| Payment screenshot fails | Create `payment-proofs` bucket in Storage |
| Products still show 8 defaults | Empty DB seeds once — delete unwanted rows in Supabase **Table Editor → products**, then add yours in admin |
