import { getSql, Env as DbEnv } from './lib/db';
import { generateSeoSchemaOpenAI } from './lib/ai';
import { requireAuth, formatAuthError, type AuthUser } from './lib/auth';
import { validateGenerateResult, formatValidationErrors } from './lib/validator';
import { insertGeneration, insertGenerationError } from './lib/storage';
import { successResponse, errorResponse, formatResponse, ERRORS, type GenerationResponseData } from './lib/response';
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

		return formatResponse(errorResponse('NOT_FOUND', 'Endpoint not found'), 404);
	},
};

// ============ Types ============

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

// ============ Main Handler ============

async function handleGenerate(request: Request, env: Env): Promise<Response> {
	console.log('=== REQUEST RECEIVED ===');
	console.log('Method:', request.method);
	console.log('URL:', request.url);

	try {
		// 1) AUTHENTICATE USER
		console.log('Step 1: Authenticating user...');
		const authHeader = request.headers.get('Authorization');
		let user: AuthUser;

		try {
			user = await requireAuth(authHeader, env);
			console.log('✅ User authenticated:', user.email);
		} catch (err: any) {
			console.log('❌ Auth failed:', err.message);
			const authError = formatAuthError(err);
			return formatResponse(errorResponse(authError.code, authError.message), 401);
		}

		// 2) Parse and validate request body
		console.log('Step 2: Parsing request body...');
		const body = (await request.json()) as Partial<GenerateRequestBody>;
		console.log('Body parsed:', { contentType: body.contentType, title: body.title?.substring(0, 50) });

		if (!body.contentType || !body.title) {
			return formatResponse(ERRORS.INVALID_REQUEST(), 400);
		}

		// 3) Check usage limits
		console.log('Step 3: Checking usage limits...');
		const sql = getSql(env);
		console.log('Database connection initialized');

		const usage = await getUserUsage(sql, user.id, user.monthlyLimit);
		console.log('Usage retrieved:', usage.generationsUsed, '/', user.monthlyLimit);

		if (usage.generationsUsed >= user.monthlyLimit) {
			console.log('❌ Quota exceeded');
			return formatResponse(ERRORS.QUOTA_EXCEEDED(usage.generationsUsed, user.monthlyLimit), 429);
		}

		// Prepare input data
		console.log('Step 4: Preparing input data...');
		const inputData = {
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
		};
		console.log('Input data prepared');

		// 4) Generate SEO metadata via OpenAI
		console.log('Step 5: Calling OpenAI...');
		console.log('OpenAI API key present:', !!env.OPENAI_API_KEY);

		let result, tokens;
		try {
			const aiResponse = await generateSeoSchemaOpenAI(inputData, env.OPENAI_API_KEY);
			result = aiResponse.result;
			tokens = aiResponse.tokens;
			console.log('✅ OpenAI response received');
			console.log('Tokens:', tokens);
		} catch (aiErr: any) {
			console.error('❌ OpenAI error:', aiErr.message);
			console.error('Full OpenAI error:', aiErr);
			throw aiErr;
		}

		// 5) VALIDATE RESULT
		console.log('Step 6: Validating result...');
		const validation = validateGenerateResult(result);
		console.log('Validation passed:', validation.valid);

		if (!validation.valid) {
			const errorMessage = formatValidationErrors(validation.errors);
			console.error('❌ Validation failed:', errorMessage);

			// Save error to DB for debugging
			try {
				await insertGenerationError(
					{
						userId: user.id,
						planId: user.planId,
						input: inputData,
						error: errorMessage,
						tokens,
					},
					env,
				);
			} catch (err) {
				console.error('Failed to log error generation:', err);
			}

			return formatResponse(ERRORS.VALIDATION_FAILED(validation.errors), 500);
		}

		console.log('✅ Response validated successfully');

		// 6) SAVE GENERATION RECORD
		console.log('Step 7: Saving generation record...');
		let generationId: string | null = null;
		try {
			const generation = await insertGeneration(
				{
					userId: user.id,
					planId: user.planId,
					input: inputData,
					output: result,
					tokens,
				},
				env,
			);

			generationId = generation.id;
			console.log('✅ Generation saved - ID:', generationId);
		} catch (err: any) {
			console.error('❌ Failed to save generation:', err.message);
			console.error('Full error:', err);
			return formatResponse(ERRORS.STORAGE_FAILED(), 500);
		}

		// 7) INCREMENT USAGE COUNTER
		try {
			await incrementUserUsage(sql, user.id, usage);
			console.log(`✅ Usage incremented - User: ${user.id}, New count: ${usage.generationsUsed + 1}`);
		} catch (err: any) {
			console.error('❌ Failed to increment usage:', err);
		}

		// 8) Return success
		console.log('Step 9: Returning success response...');
		const responseData: GenerationResponseData = {
			generationId: generationId!,
			userId: user.id,
			usage: {
				used: usage.generationsUsed + 1,
				limit: user.monthlyLimit,
			},
			tokens,
			result,
		};

		return formatResponse(successResponse(responseData), 200);
	} catch (err: any) {
		const msg = String(err?.message || '');

		console.error('=== UNHANDLED ERROR ===');
		console.error('Error message:', err?.message);
		console.error('Error stack:', err?.stack);
		console.error('Full error:', err);
		console.error('======================');

		// Handle OpenAI quota errors
		if (msg.includes('insufficient_quota') || msg.includes('You exceeded your current quota')) {
			return formatResponse(ERRORS.OPENAI_QUOTA(), 503);
		}

		console.error('Error in /generate:', err);
		return formatResponse(ERRORS.INTERNAL_ERROR(), 500);
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
