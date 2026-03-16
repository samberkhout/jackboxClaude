-- ============================================================
-- Foto Logbook — Hop & Bites BBQ Architect
-- ============================================================

CREATE TABLE IF NOT EXISTS photo_logbook (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_url     TEXT NOT NULL,
    edited_url       TEXT,
    category         TEXT NOT NULL DEFAULT 'Admin'
                     CHECK (category IN ('Food', 'Gear', 'Sfeer', 'Admin')),
    ai_tags          JSONB DEFAULT '[]'::JSONB,
    ai_description   TEXT,
    event_id         UUID REFERENCES events(id) ON DELETE SET NULL,
    uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION trg_fn_photo_logbook_updated()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_photo_logbook_updated ON photo_logbook;
CREATE TRIGGER trg_photo_logbook_updated
    BEFORE UPDATE ON photo_logbook
    FOR EACH ROW EXECUTE FUNCTION trg_fn_photo_logbook_updated();

-- Index voor snel filteren op categorie
CREATE INDEX IF NOT EXISTS idx_photo_logbook_category  ON photo_logbook (category);
CREATE INDEX IF NOT EXISTS idx_photo_logbook_uploaded  ON photo_logbook (uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_logbook_event     ON photo_logbook (event_id);

-- Row Level Security
ALTER TABLE photo_logbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_photo_logbook" ON photo_logbook;
CREATE POLICY "allow_all_photo_logbook"
    ON photo_logbook FOR ALL
    USING (true) WITH CHECK (true);
