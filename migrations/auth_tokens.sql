-- Create auth_tokens table
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    CONSTRAINT token_not_empty CHECK (token != '')
);

-- Create index for fast token lookups
CREATE INDEX idx_auth_tokens_token ON auth_tokens (token)
WHERE
    is_active = true;

CREATE INDEX idx_auth_tokens_user_id ON auth_tokens (user_id);

-- Add seed data: example demo token for your first user
INSERT INTO
    auth_tokens (
        user_id,
        token,
        name,
        is_active
    )
SELECT id, 'demo-token-12345abcde', 'Demo Token', true
FROM users
LIMIT 1;

-- Set auth_tokens to expire in 365 days
UPDATE auth_tokens
SET
    expires_at = now() + interval '365 days'
WHERE
    expires_at IS NULL
    AND is_active = true;