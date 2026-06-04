# LookLike Backend

Simple JSON-file backed API for products.

## Endpoints

- `GET /health`
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/payments/config`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `GET /api/orders`

## Razorpay setup

1. Create keys at [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).
2. Copy `backend/.env.example` to `backend/.env` and set:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
3. Restart the backend.

Orders are saved in `data/orders.json`. Payment screenshots are stored as files in `data/proofs/`.

## Render (production) — keep your products

On Render’s **free** plan, `backend/data` is wiped when the service **restarts** or **redeploys**. That is why products can look “reset” to the default 8 items.

**Fix:** In the Render dashboard → your web service → **Disks** → add a persistent disk (e.g. 1 GB) mounted at `/opt/render/project/src/backend/data`, and set env `DATA_DIR` to that path (or keep `./backend/data` if the mount replaces that folder).

The app no longer overwrites your `products.json` when validation fails — but you still need a persistent disk (or an external database) so files survive restarts.

## Run locally

```bash
npm install
npm run dev
```

Default port is `8080`.

## Production data (Supabase — free)

On Render **free**, local files are wiped on restart. Use **Supabase** instead:

1. Follow **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** step by step.
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Render.
3. After deploy, open `/health` — should show `"store": "supabase"`.

Without Supabase env vars, the server falls back to JSON files in `DATA_DIR` (local dev only).

