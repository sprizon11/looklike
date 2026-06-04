-- Look Like shop — run once in Supabase SQL Editor (Dashboard → SQL → New query)

-- Products (full JSON document per row — includes colors[], images as URLs or data URLs)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC);

-- Orders (customer, items, payment status, etc.)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- Storage bucket for payment screenshots (create in Dashboard → Storage if SQL below fails)
-- Name: payment-proofs (private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;
