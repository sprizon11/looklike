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

Orders are saved in `data/orders.json`.

## Run locally

```bash
npm install
npm run dev
```

Default port is `8080`.

