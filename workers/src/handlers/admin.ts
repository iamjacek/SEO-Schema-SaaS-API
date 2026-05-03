// src/handlers/admin.ts

import { requireAdminKey, createToken, listTokens, revokeToken, rotateToken } from '../lib/admin';
import { formatResponse, successResponse, errorResponse } from '../lib/response';
import type { Env } from '../index';

export async function handleAdminCreateToken(request: Request, env: Env): Promise<Response> {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!requireAdminKey(authHeader, env.ADMIN_KEY)) {
			return formatResponse(errorResponse('UNAUTHORIZED', 'Invalid or missing admin key'), 401);
		}

		const body = (await request.json()) as { userId: string; name: string };
		if (!body.userId || !body.name) {
			return formatResponse(errorResponse('INVALID_REQUEST', 'userId and name are required'), 400);
		}

		const { id, token } = await createToken(body.userId, body.name, env);

		console.log(`✅ Admin: Token created - ID: ${id}`);

		return formatResponse(
			successResponse({
				id,
				token,
				message: 'Token created. Save this token securely - it will not be shown again.',
			}),
			200,
		);
	} catch (err: any) {
		console.error('Admin error:', err);
		return formatResponse(errorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
	}
}

export async function handleAdminListTokens(request: Request, env: Env): Promise<Response> {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!requireAdminKey(authHeader, env.ADMIN_KEY)) {
			return formatResponse(errorResponse('UNAUTHORIZED', 'Invalid or missing admin key'), 401);
		}

		const userId = new URL(request.url).searchParams.get('userId');
		if (!userId) {
			return formatResponse(errorResponse('INVALID_REQUEST', 'userId query parameter required'), 400);
		}

		const tokens = await listTokens(userId, env);
		const redacted = tokens.map((t) => ({
			...t,
			token: t.token.substring(0, 10) + '...',
		}));

		return formatResponse(successResponse({ userId, tokens: redacted }), 200);
	} catch (err: any) {
		console.error('Admin error:', err);
		return formatResponse(errorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
	}
}

export async function handleAdminRevokeToken(tokenId: string, request: Request, env: Env): Promise<Response> {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!requireAdminKey(authHeader, env.ADMIN_KEY)) {
			return formatResponse(errorResponse('UNAUTHORIZED', 'Invalid or missing admin key'), 401);
		}

		const userId = new URL(request.url).searchParams.get('userId');
		if (!userId) {
			return formatResponse(errorResponse('INVALID_REQUEST', 'userId query parameter required'), 400);
		}

		const success = await revokeToken(tokenId, userId, env);

		if (!success) {
			return formatResponse(errorResponse('NOT_FOUND', 'Token not found or already revoked'), 404);
		}

		console.log(`✅ Admin: Token revoked - ID: ${tokenId}`);

		return formatResponse(successResponse({ message: 'Token revoked' }), 200);
	} catch (err: any) {
		console.error('Admin error:', err);
		return formatResponse(errorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
	}
}

export async function handleAdminRotateToken(tokenId: string, request: Request, env: Env): Promise<Response> {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!requireAdminKey(authHeader, env.ADMIN_KEY)) {
			return formatResponse(errorResponse('UNAUTHORIZED', 'Invalid or missing admin key'), 401);
		}

		const userId = new URL(request.url).searchParams.get('userId');
		if (!userId) {
			return formatResponse(errorResponse('INVALID_REQUEST', 'userId query parameter required'), 400);
		}

		const { id, token } = await rotateToken(tokenId, userId, env);

		console.log(`✅ Admin: Token rotated - Old ID: ${tokenId}, New ID: ${id}`);

		return formatResponse(
			successResponse({
				oldTokenId: tokenId,
				newTokenId: id,
				newToken: token,
				message: 'Token rotated. Old token revoked, new token created.',
			}),
			200,
		);
	} catch (err: any) {
		console.error('Admin error:', err);
		return formatResponse(errorResponse('INTERNAL_ERROR', 'Internal server error'), 500);
	}
}
