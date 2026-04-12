// src/lib/auth.ts
import { getSql } from './db';
import type { Env as DbEnv } from './db';

export type AuthUser = {
	id: string;
	email: string;
	planId: string;
	monthlyLimit: number;
};

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | null): string | null {
	if (!authHeader) return null;
	if (!authHeader.startsWith('Bearer ')) return null;
	return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Authenticate user by bearer token
 * Returns user if valid token, throws error if invalid or expired
 */
export async function requireAuth(authHeader: string | null, env: DbEnv): Promise<AuthUser> {
	const token = extractBearerToken(authHeader);

	if (!token) {
		throw new Error('MISSING_AUTH_HEADER');
	}

	const sql = getSql(env);

	// Look up token in DB
	const result = await sql`
    SELECT 
      u.id,
      u.email,
      u.plan_id,
      p.monthly_generations,
      at.expires_at,
      at.is_active
    FROM auth_tokens at
    JOIN users u ON u.id = at.user_id
    JOIN plans p ON p.id = u.plan_id
    WHERE at.token = ${token}
    LIMIT 1
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];

	if (rows.length === 0) {
		throw new Error('INVALID_AUTH_TOKEN');
	}

	const row = rows[0] as any;

	// Check if token is active
	if (!row.is_active) {
		throw new Error('TOKEN_REVOKED');
	}

	// Check if token is expired
	if (row.expires_at && new Date(row.expires_at) < new Date()) {
		throw new Error('TOKEN_EXPIRED');
	}

	// Update last_used_at timestamp (fire and forget, don't block auth)
	trackTokenUsage(sql, token).catch((err) => {
		console.warn('Failed to track token usage:', err);
	});

	return {
		id: row.id,
		email: row.email,
		planId: row.plan_id,
		monthlyLimit: row.monthly_generations,
	};
}

/**
 * Update token's last_used_at timestamp
 * Separate function for easier testing and error handling
 */
async function trackTokenUsage(sql: any, token: string): Promise<void> {
	const result = await sql`
    UPDATE auth_tokens
    SET last_used_at = now()
    WHERE token = ${token}
    RETURNING id, user_id, last_used_at
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];

	if (rows.length > 0) {
		const row = rows[0];
		console.log(`✅ Token usage tracked - User: ${row.user_id}, Last Used: ${row.last_used_at}`);
	}
}

/**
 * Format auth error for API response
 */
export function formatAuthError(error: Error): { code: string; message: string } {
	if (error.message === 'MISSING_AUTH_HEADER') {
		return {
			code: 'MISSING_AUTH_HEADER',
			message: 'Authorization header required. Use: Authorization: Bearer <token>',
		};
	}

	if (error.message === 'INVALID_AUTH_TOKEN') {
		return {
			code: 'INVALID_AUTH_TOKEN',
			message: 'Invalid authentication token',
		};
	}

	if (error.message === 'TOKEN_REVOKED') {
		return {
			code: 'TOKEN_REVOKED',
			message: 'This token has been revoked. Please request a new token.',
		};
	}

	if (error.message === 'TOKEN_EXPIRED') {
		return {
			code: 'TOKEN_EXPIRED',
			message: 'Token expired. Please request a new token.',
		};
	}

	return {
		code: 'AUTH_ERROR',
		message: 'Authentication failed',
	};
}
