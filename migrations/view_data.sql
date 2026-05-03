-- some queries to view data in the auth_tokens and generations tables for debugging and monitoring purposes
-- you may find it helpful to run these queries in your database client to check the data after running the migrations and seeding

-- View all active tokens with expiration
SELECT
    id,
    user_id,
    token,
    name,
    is_active,
    created_at,
    expires_at,
    (expires_at - now()) as time_until_expiration
FROM auth_tokens
WHERE
    is_active = true
ORDER BY created_at DESC;

-- View token usage statistics
SELECT
    id,
    user_id,
    token,
    name,
    created_at,
    last_used_at,
    expires_at,
    CASE
        WHEN last_used_at IS NULL THEN 'Never used'
        WHEN last_used_at < now() - interval '30 days' THEN 'Unused for 30+ days'
        WHEN last_used_at < now() - interval '7 days' THEN 'Unused for 7+ days'
        ELSE 'Recently used'
    END as usage_status,
    (now() - last_used_at) as time_since_last_use
FROM auth_tokens
WHERE
    is_active = true
ORDER BY last_used_at DESC NULLS LAST;

-- View column names and data types
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_name = 'generations'
ORDER BY ordinal_position;

-- View all active tokens with expiration
SELECT
    id,
    user_id,
    token,
    name,
    is_active,
    created_at,
    expires_at,
    (expires_at - now()) as time_until_expiration
FROM auth_tokens
WHERE
    is_active = true
ORDER BY created_at DESC;

-- Lookup for demo token - use your demo token value here
SELECT at.token, at.is_active, at.expires_at, at.user_id, u.email, u.plan_id, p.monthly_generations
FROM
    auth_tokens at
    JOIN users u ON u.id = at.user_id
    JOIN plans p ON p.id = u.plan_id
WHERE
    at.token = 'demo-token-your-value-here';

-- View all generated records
SELECT
    id,
    user_id,
    content_type,
    input_title,
    meta_title,
    tokens_input,
    tokens_output,
    status,
    created_at
FROM generations
ORDER BY created_at DESC
LIMIT 10;

-- View usage tracking
SELECT
    user_id,
    period_start,
    period_end,
    generations_used,
    updated_at
FROM user_usage
WHERE
    user_id = 'user-id-here' -- replace with actual user ID
ORDER BY updated_at DESC;

-- Verify all input fields are stored
SELECT
    id,
    user_id,
    input_title,
    target_keyword,
    site_name,
    brand_voice,
    tone,
    language,
    content_type
FROM generations
ORDER BY created_at DESC
LIMIT 100;