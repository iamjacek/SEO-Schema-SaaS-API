-- users
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- plans
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    monthly_generations INT NOT NULL,
    price_monthly_cents INT NOT NULL,
    price_yearly_cents INT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO
    plans (
        id,
        name,
        monthly_generations,
        price_monthly_cents
    )
VALUES (
        'free_trial',
        'Free Trial',
        30,
        0
    ),
    (
        'starter',
        'Starter',
        200,
        1500
    ),
    ('pro', 'Pro', 3000, 3900),
    (
        'agency',
        'Agency',
        10000,
        9900
    ) ON CONFLICT (id) DO NOTHING;

-- user_usage
CREATE TABLE IF NOT EXISTS user_usage (
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    generations_used INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- generations
CREATE TABLE IF NOT EXISTS generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES plans (id),
    project_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_type TEXT NOT NULL,
    language TEXT NOT NULL,
    tone TEXT,
    input_title TEXT,
    input_brief TEXT,
    meta_title TEXT,
    meta_description TEXT,
    og_tags JSONB,
    schema_jsonld JSONB,
    provider TEXT NOT NULL,
    model TEXT,
    tokens_input INT,
    tokens_output INT,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT
);

-- projects (optional)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE generations
ADD CONSTRAINT generations_project_fk FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL;

-- Add missing columns if they don't exist
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS tone VARCHAR(100),
ADD COLUMN IF NOT EXISTS target_keyword VARCHAR(255),
ADD COLUMN IF NOT EXISTS site_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS brand_voice VARCHAR(255),
ADD COLUMN IF NOT EXISTS input_brief TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS og_tags JSONB,
ADD COLUMN IF NOT EXISTS schema_jsonld JSONB,
ADD COLUMN IF NOT EXISTS twitter_tags JSONB,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS model VARCHAR(50) DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS tokens_input INTEGER,
ADD COLUMN IF NOT EXISTS tokens_output INTEGER,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Create indexes for fast lookups (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations (user_id);

CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations (created_at);

CREATE INDEX IF NOT EXISTS idx_generations_status ON generations (status);

CREATE INDEX IF NOT EXISTS idx_generations_plan_id ON generations (plan_id);