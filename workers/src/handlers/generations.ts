// src/handlers/generations.ts

import { getSql } from '../lib/db';
import { requireAuth, type AuthUser } from '../lib/auth';
import { formatResponse, successResponse, errorResponse } from '../lib/response';
import type { Env } from '../index';

export async function handleGetGenerations(request: Request, env: Env): Promise<Response> {
	try {
		const authHeader = request.headers.get('Authorization');
		let user: AuthUser;

		try {
			user = await requireAuth(authHeader, env);
		} catch (err: any) {
			const authError = require('../lib/auth').formatAuthError(err);
			return formatResponse(errorResponse(authError.code, authError.message), 401);
		}

		const sql = getSql(env);

		// Get user's generations
		const generationsResult = await sql`
      SELECT 
        id,
        content_type,
        input_title,
        meta_title,
        tokens_input,
        tokens_output,
        status,
        created_at
      FROM generations
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

		const generations = Array.isArray(generationsResult) ? generationsResult : (generationsResult as any).rows || [];

		// Get user's usage
		const usage = await getUserUsage(sql, user.id);

		return formatResponse(
			successResponse({
				usage: usage.generationsUsed,
				limit: user.monthlyLimit,
				generations,
			}),
			200,
		);
	} catch (err: any) {
		console.error('Error in /api/generations:', err);
		return formatResponse(errorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
	}
}

async function getUserUsage(sql: any, userId: string) {
	const now = new Date();
	const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	const result = await sql`
    SELECT generations_used
    FROM user_usage
    WHERE user_id = ${userId}
      AND period_start = ${periodStart.toISOString()}
      AND period_end = ${periodEnd.toISOString()}
    LIMIT 1
  `;

	const rows = Array.isArray(result) ? result : (result as any).rows || [];
	return {
		generationsUsed: rows.length > 0 ? rows[0].generations_used : 0,
	};
}
