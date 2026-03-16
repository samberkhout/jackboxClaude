-- ============================================================
-- Service Mode v2 — The Architect: Gerechten Uitbreiding
-- Hop & Bites BBQ Architect
-- Voer dit uit in de Supabase SQL Editor
-- ============================================================

-- ── Nieuwe kolommen op gerechten ──────────────────────────────────────────────
-- Voeg service-gerelateerde velden toe die The Architect modal gebruikt.

DO $$
BEGIN
    -- service_image: URL naar plating/presentatie foto (apart van bereiding foto)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gerechten' AND column_name = 'service_image'
    ) THEN
        ALTER TABLE gerechten
            ADD COLUMN service_image TEXT NOT NULL DEFAULT '';
    END IF;

    -- battle_plan_steps: geordende stappen voor service uitvoering
    -- Opgeslagen als JSONB array van strings: ["Leg saus op bord", "Snijd vlees", ...]
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gerechten' AND column_name = 'battle_plan_steps'
    ) THEN
        ALTER TABLE gerechten
            ADD COLUMN battle_plan_steps JSONB NOT NULL DEFAULT '[]'::JSONB;
    END IF;

    -- target_prep_time: streeftijd in seconden voor de timer in The Architect modal
    -- 0 = geen timer, bijv. 300 = 5 minuten doelstelling
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gerechten' AND column_name = 'target_prep_time'
    ) THEN
        ALTER TABLE gerechten
            ADD COLUMN target_prep_time INTEGER NOT NULL DEFAULT 0;
    END IF;
END
$$;

-- ── gangen tabel (indien nog niet aanwezig) ───────────────────────────────────
-- Bevat de vaste gangen: Amuse, Hoofd, Nagerecht etc. met volgorde en slug.

CREATE TABLE IF NOT EXISTS gangen (
    id       SERIAL      PRIMARY KEY,
    slug     TEXT        NOT NULL UNIQUE,   -- 'amuse', 'hoofd', 'dessert', etc.
    naam     TEXT        NOT NULL,
    volgorde INTEGER     NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gangen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_gangen" ON gangen;
CREATE POLICY "allow_all_gangen"
    ON gangen FOR ALL
    USING (true) WITH CHECK (true);

-- Standaard gangen invoegen als tabel leeg is
INSERT INTO gangen (slug, naam, volgorde)
SELECT * FROM (VALUES
    ('amuse',    'Amuse',     1),
    ('voor',     'Voorgerecht', 2),
    ('tussenge', 'Tussengerecht', 3),
    ('hoofd',    'Hoofdgerecht', 4),
    ('dessert',  'Dessert',   5)
) AS v(slug, naam, volgorde)
WHERE NOT EXISTS (SELECT 1 FROM gangen LIMIT 1);
