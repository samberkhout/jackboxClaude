-- =============================================
-- Price Intelligence Module — Supabase Schema
-- Voer dit uit in de Supabase SQL Editor
-- =============================================

-- Tabel: leveranciers prijzen
CREATE TABLE IF NOT EXISTS supplier_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL CHECK (supplier_name IN ('Sligro', 'Hanos', 'Bidfood')),
  article_number TEXT NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  price_per_unit NUMERIC(10,4) DEFAULT 0,
  previous_price NUMERIC(10,4) DEFAULT NULL,
  unit_type TEXT DEFAULT 'stuks',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (supplier_name, article_number)
);

-- Trigger: sla vorige prijs op bij prijswijziging
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_per_unit IS DISTINCT FROM NEW.price_per_unit THEN
    NEW.previous_price = OLD.price_per_unit;
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_track_price_change ON supplier_prices;
CREATE TRIGGER trg_track_price_change
  BEFORE UPDATE ON supplier_prices
  FOR EACH ROW EXECUTE FUNCTION track_price_change();

-- RLS
ALTER TABLE supplier_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON supplier_prices FOR ALL USING (true) WITH CHECK (true);
