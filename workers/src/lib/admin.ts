// src/lib/admin.ts

import { getSql } from './db';
import type { Env as DbEnv } from './db';
import crypto from 'crypto';

/**
 * Verify admin access via master key
 */
export function requireAdminKey(authHeader: string | null, adminKey: string): boolean {
	if (!authHeader) return false;
	if (!authHeader.startsWith('Bearer ')) return false;

	const key = authHeader.substring(7);
	return key === adminKey;
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(): string {
	return crypto
		.getRandomValues(new Uint8Array(32))
		.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
		.substring(0, 64);
}

/**
 * Create a new API token for a user
 */
export async function createToken(userId: string, name: string, env: DbEnv): Promise<{ id: string; token: string }> {
	const sql = getSql(env);
	const token = generateSecureToken();

	const result = await sql`
    INSERT INTO auth_tokens (user_id, token, name, is_active, expires_at)
    VALUES (
      ${userId},
      ${token},
      ${name},
      true,
      now() + interval '365 days'
    )
    RETURNING id
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];

	if (rows.length === 0) {
		throw new Error('Failed to create token');
	}

	return {
		id: rows[0].id,
		token, // Only return once!
	};
}

/**
 * List all tokens for a user
 */
export async function listTokens(userId: string, env: DbEnv): Promise<any[]> {
	const sql = getSql(env);

	const result = await sql`
    SELECT 
      id,
      token,
      name,
      is_active,
      created_at,
      last_used_at,
      expires_at
    FROM auth_tokens
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

	return Array.isArray(result) ? result : (result as any).rows || [];
}

/**
 * Revoke a token
 */
export async function revokeToken(tokenId: string, userId: string, env: DbEnv): Promise<boolean> {
	const sql = getSql(env);

	const result = await sql`
    UPDATE auth_tokens
    SET is_active = false, updated_at = now()
    WHERE id = ${tokenId} AND user_id = ${userId}
    RETURNING id
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];
	return rows.length > 0;
}

/**
 * Rotate a token (revoke old, create new)
 */
export async function rotateToken(tokenId: string, userId: string, env: DbEnv): Promise<{ id: string; token: string }> {
	const sql = getSql(env);

	// Revoke old token
	await sql`
    UPDATE auth_tokens
    SET is_active = false, updated_at = now()
    WHERE id = ${tokenId} AND user_id = ${userId}
  `;

	// Create new token
	return createToken(userId, 'Rotated Token', env);
}

/**
 * Get token stats
 */
export async function getTokenStats(tokenId: string, env: DbEnv): Promise<any> {
	const sql = getSql(env);

	const result = await sql`
    SELECT 
      id,
      name,
      created_at,
      last_used_at,
      COUNT(g.id) as total_generations
    FROM auth_tokens at
    LEFT JOIN generations g ON g.user_id = at.user_id
    WHERE at.id = ${tokenId}
    GROUP BY at.id, at.name, at.created_at, at.last_used_at
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];
	return rows.length > 0 ? rows[0] : null;
}
