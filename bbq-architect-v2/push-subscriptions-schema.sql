-- =============================================
-- Push Subscriptions — Supabase Schema
-- Voer dit uit in de Supabase SQL Editor
-- =============================================

-- Tabel: push subscription opslag
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);
