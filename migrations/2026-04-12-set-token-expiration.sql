-- Set auth_tokens to expire in 365 days
UPDATE auth_tokens
SET
    expires_at = now() + interval '365 days'
WHERE
    expires_at IS NULL
    AND is_active = true;