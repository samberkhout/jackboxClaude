-- ============================================================
-- HACCP Temperatuurregistratie — Hop & Bites BBQ Architect
-- Voer dit uit in de Supabase SQL Editor
-- ============================================================

-- ── haccp_records ─────────────────────────────────────────────────────────────
-- Slaat alle temperatuurmetingen op: ontvangst, opslag, bereiding, regenereren,
-- uitgifte. Auto-gelogd via Service Mode of handmatig via de HACCP-pagina.

CREATE TABLE IF NOT EXISTS haccp_records (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Koppeling
    event_id    INTEGER     REFERENCES events(id)   ON DELETE SET NULL,
    offerte_id  TEXT,                               -- tekst-ID (bijv. "42")
    gang_slug   TEXT,                               -- welke gang: 'amuse', 'hoofd', etc.
    -- Wat / wanneer
    datum       DATE        NOT NULL DEFAULT CURRENT_DATE,
    tijd        TEXT        NOT NULL DEFAULT '',    -- 'HH:MM'
    wat         TEXT        NOT NULL DEFAULT '',    -- productnaam
    temp        NUMERIC(5,1) NOT NULL DEFAULT 0,   -- temperatuur in °C
    -- Type checks
    type        TEXT        NOT NULL DEFAULT 'kern'
                            CHECK (type IN ('kern', 'koeling', 'warmhoud')),
    check_type  TEXT        NOT NULL DEFAULT 'bereiding'
                            CHECK (check_type IN ('ontvangst', 'opslag', 'bereiding', 'regenereren', 'uitgifte')),
    -- Status (afgeleid van temp + type)
    status      TEXT        NOT NULL DEFAULT 'ok'
                            CHECK (status IN ('ok', 'warn', 'danger')),
    -- Metadata
    chef        TEXT        NOT NULL DEFAULT 'Cor',
    notitie     TEXT        NOT NULL DEFAULT '',
    auto_logged BOOLEAN     NOT NULL DEFAULT FALSE,-- TRUE = automatisch via Service Mode Quick-Log
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes voor snelle queries
CREATE INDEX IF NOT EXISTS idx_haccp_offerte    ON haccp_records (offerte_id);
CREATE INDEX IF NOT EXISTS idx_haccp_event      ON haccp_records (event_id);
CREATE INDEX IF NOT EXISTS idx_haccp_datum      ON haccp_records (datum DESC);
CREATE INDEX IF NOT EXISTS idx_haccp_status     ON haccp_records (status);
CREATE INDEX IF NOT EXISTS idx_haccp_gang       ON haccp_records (gang_slug);

-- RLS: iedereen mag lezen/schrijven (interne app, geen publieke data)
ALTER TABLE haccp_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_haccp_records" ON haccp_records;
CREATE POLICY "allow_all_haccp_records"
    ON haccp_records FOR ALL
    USING (true) WITH CHECK (true);


-- ── service_logs ──────────────────────────────────────────────────────────────
-- Timing per gang per event, aangemaakt door Service Mode.

CREATE TABLE IF NOT EXISTS service_logs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    offerte_id       TEXT        NOT NULL,
    gang_slug        TEXT        NOT NULL,
    started_at       TIMESTAMPTZ,
    served_at        TIMESTAMPTZ,
    duration_seconds INTEGER     NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_logs_offerte ON service_logs (offerte_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_gang    ON service_logs (gang_slug);

ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_service_logs" ON service_logs;
CREATE POLICY "allow_all_service_logs"
    ON service_logs FOR ALL
    USING (true) WITH CHECK (true);


-- ── Migratie: voeg kolommen toe als tabel al bestaat ──────────────────────────
-- Veilig uitvoeren als de tabel al bestond zonder de nieuwe kolommen.

DO $$
BEGIN
    -- haccp_records nieuwe kolommen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'haccp_records' AND column_name = 'check_type'
    ) THEN
        ALTER TABLE haccp_records
            ADD COLUMN check_type  TEXT NOT NULL DEFAULT 'bereiding'
                CHECK (check_type IN ('ontvangst', 'opslag', 'bereiding', 'regenereren', 'uitgifte')),
            ADD COLUMN chef        TEXT NOT NULL DEFAULT 'Cor',
            ADD COLUMN offerte_id  TEXT,
            ADD COLUMN gang_slug   TEXT,
            ADD COLUMN auto_logged BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END
$$;
