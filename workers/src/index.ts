import { getSql, Env as DbEnv } from './lib/db';
import { generateSeoSchemaOpenAI } from './lib/ai';
import { requireAuth, formatAuthError, type AuthUser } from './lib/auth';
import type { NeonQueryFunction } from '@neondatabase/serverless';

export interface Env extends DbEnv {
	DATABASE_URL: string;
	OPENAI_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/generate' && request.method === 'POST') {
			return handleGenerate(request, env);
		}

		if (url.pathname === '/' && request.method === 'GET') {
			return new Response('SEO Schema SaaS API is running', { status: 200 });
		}

		return new Response('Not found', { status: 404 });
	},
};

// ============ Types ============

type User = {
	id: string;
	email: string;
	planId: string;
	monthlyLimit: number;
};

type Usage = {
	userId: string;
	periodStart: string;
	periodEnd: string;
	generationsUsed: number;
};

type GenerateRequestBody = {
	contentType: 'Article' | 'Product' | 'LocalBusiness' | 'Service';
	title: string;
	brief?: string;
	language?: string;
	tone?: string;
	targetKeyword?: string;
	siteName?: string;
	brandVoice?: string;
	imageUrl?: string;
	baseUrl?: string;
};

// ============ Main Handler ============

async function handleGenerate(request: Request, env: Env): Promise<Response> {
	console.log('=== REQUEST RECEIVED ===');

	try {
		// 1) AUTHENTICATE USER - Extract and validate bearer token
		const authHeader = request.headers.get('Authorization');
		let user: AuthUser;

		try {
			user = await requireAuth(authHeader, env);
			console.log('✅ User authenticated:', user.email);
		} catch (err: any) {
			const authError = formatAuthError(err);
			return json({ ok: false, error: authError }, 401);
		}

		// 2) Parse and validate request body
		const body = (await request.json()) as Partial<GenerateRequestBody>;
		if (!body.contentType || !body.title) {
			return json({ ok: false, error: { code: 'INVALID_REQUEST', message: 'contentType and title are required' } }, 400);
		}

		// 3) Check usage limits
		const sql = getSql(env);
		const usage = await getUserUsage(sql, user.id, user.monthlyLimit);

		if (usage.generationsUsed >= user.monthlyLimit) {
			return json(
				{
					ok: false,
					error: {
						code: 'QUOTA_EXCEEDED',
						message: 'Monthly limit reached',
						details: { limit: user.monthlyLimit, used: usage.generationsUsed },
					},
				},
				429,
			);
		}

		// 4) Generate SEO metadata via OpenAI
		console.log('Input to AI:', {
			contentType: body.contentType,
			title: body.title,
			brief: body.brief || '',
			language: body.language || 'en',
			tone: body.tone || 'neutral',
			targetKeyword: body.targetKeyword || '',
			siteName: body.siteName || '',
			brandVoice: body.brandVoice || '',
			imageUrl: body.imageUrl,
			baseUrl: body.baseUrl,
		});

		const result = await generateSeoSchemaOpenAI(
			{
				contentType: body.contentType,
				title: body.title,
				brief: body.brief || '',
				language: body.language || 'en',
				tone: body.tone || 'neutral',
				targetKeyword: body.targetKeyword || '',
				siteName: body.siteName || '',
				brandVoice: body.brandVoice || '',
				imageUrl: body.imageUrl || null,
				baseUrl: body.baseUrl || 'https://example.com',
			},
			env.OPENAI_API_KEY,
		);

		// 5) Increment usage counter
		await incrementUserUsage(sql, user.id, usage);

		return json(
			{
				ok: true,
				data: {
					userId: user.id,
					usage: {
						used: usage.generationsUsed + 1,
						limit: user.monthlyLimit,
					},
					result,
				},
			},
			200,
		);
	} catch (err: any) {
		const msg = String(err?.message || '');

		// Handle OpenAI quota errors gracefully
		if (msg.includes('insufficient_quota') || msg.includes('You exceeded your current quota')) {
			return json(
				{
					ok: false,
					error: {
						code: 'OPENAI_QUOTA',
						message: 'OpenAI quota exceeded. Please top up your account.',
					},
				},
				503,
			);
		}

		console.error('Error in /generate:', err);
		return json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal error' } }, 500);
	}
}

// ============ Database Helpers ============

async function getUserUsage(sql: NeonQueryFunction<any, any>, userId: string, monthlyLimit: number): Promise<Usage> {
	const now = new Date();
	const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	const result = await sql`
    SELECT user_id, period_start, period_end, generations_used
    FROM user_usage
    WHERE user_id = ${userId}
      AND period_start = ${periodStart.toISOString()}
      AND period_end = ${periodEnd.toISOString()}
    LIMIT 1
  `;

	// Handle both array and FullQueryResults types
	const rows = Array.isArray(result) ? result : (result as any).rows || [];

	if (rows.length === 0) {
		await sql`
      INSERT INTO user_usage (user_id, period_start, period_end, generations_used)
      VALUES (${userId}, ${periodStart.toISOString()}, ${periodEnd.toISOString()}, 0)
      ON CONFLICT (user_id) DO UPDATE
      SET period_start = ${periodStart.toISOString()},
          period_end = ${periodEnd.toISOString()},
          generations_used = 0,
          updated_at = now()
    `;

		return {
			userId,
			periodStart: periodStart.toISOString(),
			periodEnd: periodEnd.toISOString(),
			generationsUsed: 0,
		};
	}

	const row = rows[0] as any;
	return {
		userId: row.user_id,
		periodStart: row.period_start,
		periodEnd: row.period_end,
		generationsUsed: row.generations_used,
	};
}

async function incrementUserUsage(sql: NeonQueryFunction<any, any>, userId: string, current: Usage): Promise<void> {
	const newCount = current.generationsUsed + 1;

	await sql`
    UPDATE user_usage
    SET generations_used = ${newCount}, updated_at = now()
    WHERE user_id = ${userId}
      AND period_start = ${current.periodStart}
      AND period_end = ${current.periodEnd}
  `;
}

// ============ Utility Helpers ============

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
