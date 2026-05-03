import { handleGenerate } from './handlers/generate';
import { handleGetDashboard } from './handlers/dashboard';
import { handleGetGenerations } from './handlers/generations';
import { handleAdminCreateToken, handleAdminListTokens, handleAdminRevokeToken, handleAdminRotateToken } from './handlers/admin';
import { formatResponse, errorResponse } from './lib/response';
import type { Env as DbEnv } from './lib/db';

export interface Env extends DbEnv {
	DATABASE_URL: string;
	OPENAI_API_KEY: string;
	ADMIN_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// ==================== MAIN ROUTES ====================
		if (url.pathname === '/' && request.method === 'GET') {
			return new Response('SEO Schema SaaS API is running', { status: 200 });
		}

		if (url.pathname === '/generate' && request.method === 'POST') {
			return handleGenerate(request, env);
		}

		if (url.pathname === '/dashboard' && request.method === 'GET') {
			return handleGetDashboard();
		}

		if (url.pathname === '/api/generations' && request.method === 'GET') {
			return handleGetGenerations(request, env);
		}

		// ==================== ADMIN ROUTES ====================
		if (url.pathname === '/admin/tokens' && request.method === 'POST') {
			return handleAdminCreateToken(request, env);
		}

		if (url.pathname === '/admin/tokens' && request.method === 'GET') {
			return handleAdminListTokens(request, env);
		}

		if (url.pathname.match(/^\/admin\/tokens\/[^/]+$/) && request.method === 'DELETE') {
			const tokenId = url.pathname.split('/').pop();
			return handleAdminRevokeToken(tokenId!, request, env);
		}

		if (url.pathname.match(/^\/admin\/tokens\/[^/]+\/rotate$/) && request.method === 'POST') {
			const tokenId = url.pathname.split('/')[3];
			return handleAdminRotateToken(tokenId!, request, env);
		}

		// ==================== 404 ====================
		return formatResponse(errorResponse('NOT_FOUND', 'Endpoint not found'), 404);
	},
};
