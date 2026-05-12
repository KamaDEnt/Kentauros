-- Migration: Create captured_leads_registry table
-- Purpose: Track leads that have been captured/saved to prevent duplicates
-- Status options: saved_for_future_contact, emailed, converted, ignored

CREATE TABLE IF NOT EXISTS captured_leads_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_identity TEXT NOT NULL,

    -- Normalized fields for deduplication
    normalized_domain TEXT,
    normalized_email TEXT,
    normalized_phone TEXT,
    normalized_name TEXT,

    -- Lead data
    lead_id TEXT,
    company_name TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    location TEXT,
    niche TEXT,
    score INTEGER,
    source TEXT,
    snippet TEXT,

    -- Capture metadata
    capture_metric TEXT DEFAULT 'website_reformulation',
    captured_by_user_id TEXT,
    captured_by_user_name TEXT,
    tenant_id TEXT,

    -- Status tracking
    status TEXT DEFAULT 'saved_for_future_contact',
    future_contact_status TEXT DEFAULT 'saved',

    -- Timestamps
    first_captured_at TIMESTAMPTZ DEFAULT NOW(),
    last_captured_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Additional metadata as JSONB
    metadata JSONB DEFAULT '{}',

    -- Indexes for deduplication queries
    CONSTRAINT unique_lead_identity UNIQUE (lead_identity)
);

-- Create indexes for efficient deduplication lookups
CREATE INDEX IF NOT EXISTS idx_registry_normalized_domain ON captured_leads_registry(normalized_domain) WHERE normalized_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registry_normalized_email ON captured_leads_registry(normalized_email) WHERE normalized_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registry_normalized_phone ON captured_leads_registry(normalized_phone) WHERE normalized_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registry_status ON captured_leads_registry(status);
CREATE INDEX IF NOT EXISTS idx_registry_tenant ON captured_leads_registry(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registry_user ON captured_leads_registry(captured_by_user_id) WHERE captured_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registry_captured_at ON captured_leads_registry(first_captured_at DESC);

-- Add row level security
ALTER TABLE captured_leads_registry ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own leads (or admins can see all)
CREATE POLICY "Users see own captured leads"
    ON captured_leads_registry
    FOR SELECT
    USING (
        captured_by_user_id = current_user_id()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = current_user_id()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy: Users can insert their own leads
CREATE POLICY "Users insert own captured leads"
    ON captured_leads_registry
    FOR INSERT
    WITH CHECK (captured_by_user_id = current_user_id() OR captured_by_user_id IS NULL);

-- Policy: Users can update their own leads
CREATE POLICY "Users update own captured leads"
    ON captured_leads_registry
    FOR UPDATE
    USING (captured_by_user_id = current_user_id());

-- Add comment
COMMENT ON TABLE captured_leads_registry IS 'Registry of all captured leads to prevent duplicates across users and capture sessions';